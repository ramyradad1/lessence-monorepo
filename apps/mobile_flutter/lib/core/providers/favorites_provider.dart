import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import 'products_provider.dart';
import '../storage/local_db.dart';
import '../storage/sync_service.dart';
import '../utils/fetch_logger.dart';

final favoritesRepositoryProvider = Provider<FavoritesRepository>((ref) {
  return FavoritesRepository(ref.watch(supabaseClientProvider));
});

class FavoritesRepository {
  FavoritesRepository(this._supabase);
  final SupabaseClient _supabase;

  Future<Set<String>> fetchUserFavorites(String userId) async {
    final rows = await _supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId)
        .executeAndLog('FavoritesRepository:fetchUserFavorites');

    return (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map((row) => row['product_id'] as String?)
        .whereType<String>()
        .toSet();
  }

  Future<void> addFavorite(String userId, String productId) async {
    await _supabase.from('favorites').upsert({
      'user_id': userId,
      'product_id': productId,
    });
  }

  Future<void> removeFavorite(String userId, String productId) async {
    await _supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
  }
}

final favoritesControllerProvider =
    NotifierProvider<FavoritesController, FavoritesState>(
      FavoritesController.new,
    );

final favoriteProductsProvider = FutureProvider<List<AppProduct>>((ref) async {
  final favorites = ref.watch(favoritesControllerProvider);
  if (favorites.ids.isEmpty) return const <AppProduct>[];

  final ids = favorites.ids.toList(growable: false);
  final productsById =
      await ref
      .watch(productsRepositoryProvider)
      .fetchProductsByIdsBatched(ids);

  return ids
      .map((id) => productsById[id])
      .whereType<AppProduct>()
      .toList(growable: false);
});

class FavoritesState {
  const FavoritesState({
    this.ids = const <String>{},
    this.isLoading = false,
    this.isSyncing = false,
    this.errorMessage,
  });

  final Set<String> ids;
  final bool isLoading;
  final bool isSyncing;
  final String? errorMessage;

  FavoritesState copyWith({
    Set<String>? ids,
    bool? isLoading,
    bool? isSyncing,
    String? errorMessage,
    bool clearError = false,
  }) {
    return FavoritesState(
      ids: ids ?? this.ids,
      isLoading: isLoading ?? this.isLoading,
      isSyncing: isSyncing ?? this.isSyncing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  bool contains(String productId) => ids.contains(productId);
}

class FavoritesController extends Notifier<FavoritesState> {
  StreamSubscription<AuthState>? _authSubscription;
  String? _lastUserId;

  SupabaseClient get _supabase => ref.read(supabaseClientProvider);
  FavoritesRepository get _favoritesRepository =>
      ref.read(favoritesRepositoryProvider);
  LocalDb get _localDb => LocalDb.instance;
  SyncService get _syncService => ref.read(syncServiceProvider);

  @override
  FavoritesState build() {
    _authSubscription?.cancel();
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      (event) => _handleAuthChange(event.session?.user.id),
    );
    ref.onDispose(() {
      _authSubscription?.cancel();
    });
    Future.microtask(() => _handleAuthChange(_supabase.auth.currentUser?.id));
    return const FavoritesState();
  }

  Future<void> _handleAuthChange(String? userId) async {
    final previousUserId = _lastUserId;
    _lastUserId = userId;

    if (userId != null && previousUserId == null) {
      await _syncGuestToServer();
      await refresh();
      return;
    }

    await refresh();
  }

  Future<void> refresh() async {
    final userId = _supabase.auth.currentUser?.id;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      if (userId == null) {
        final localIds = await _readLocalFavorites();
        state = state.copyWith(
          ids: localIds.toSet(),
          isLoading: false,
          isSyncing: false,
          clearError: true,
        );
        return;
      }

      // 1. Get from Supabase via Repository
      final supabaseIds = await _favoritesRepository.fetchUserFavorites(userId);

      // 2. Also check local favorites that might not have been synced
      final localIds = await _readLocalFavorites();
      final mergedIds = <String>{...supabaseIds, ...localIds};

      state = state.copyWith(
        ids: mergedIds,
        isLoading: false,
        isSyncing: false,
        clearError: true,
      );
      
      // Update local cache fully to match merged
      for (final id in mergedIds) {
        await _localDb.setLocalFavorite(id, true);
      }
    } on PostgrestException catch (error) {
      // Fallback to local
      final localIds = await _readLocalFavorites();
      state = state.copyWith(
        ids: localIds.toSet(),
        isLoading: false,
        isSyncing: false,
        errorMessage: error.message,
      );
    } catch (_) {
      // Fallback to local
      final localIds = await _readLocalFavorites();
      state = state.copyWith(
        ids: localIds.toSet(),
        isLoading: false,
        isSyncing: false,
        errorMessage: 'Failed to load favorites',
      );
    }
  }

  Future<void> toggleFavorite(String productId) async {
    final userId = _supabase.auth.currentUser?.id;
    final wasFavorite = state.ids.contains(productId);

    final nextIds = <String>{...state.ids};
    if (wasFavorite) {
      nextIds.remove(productId);
    } else {
      nextIds.add(productId);
    }

    // Optimistic UI Update & Local Cache
    state = state.copyWith(ids: nextIds, isSyncing: true, clearError: true);
    await _localDb.setLocalFavorite(productId, !wasFavorite);

    if (userId == null) {
      state = state.copyWith(isSyncing: false);
      return;
    }

    // Offline-first sync (enqueue sync queue action)
    try {
      await _syncService.enqueueAction(
        wasFavorite ? 'remove_favorite' : 'add_favorite',
        {'product_id': productId},
      );
      state = state.copyWith(isSyncing: false, clearError: true);
    } catch (e) {
      // Very unlikely saving to queue fails, but if it does, don't rollback, just warn
      state = state.copyWith(
        isSyncing: false,
        errorMessage: 'Failed to queue update',
      );
    }
  }

  Future<void> _syncGuestToServer() async {
    final guestIds = await _readLocalFavorites();
    if (guestIds.isEmpty) return;

    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      // Merge by enqueuing adds for all guest IDs
      for (final id in guestIds) {
        await _syncService.enqueueAction('add_favorite', {'product_id': id});
      }
      state = state.copyWith(isSyncing: false);
    } catch (_) {
      state = state.copyWith(isSyncing: false);
    }
  }

  Future<List<String>> _readLocalFavorites() async {
    final map = await _localDb.getLocalFavorites();
    return map.entries.where((e) => e.value).map((e) => e.key).toList();
  }
}
