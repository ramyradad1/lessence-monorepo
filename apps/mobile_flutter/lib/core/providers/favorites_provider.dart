import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import 'products_provider.dart';

final favoritesControllerProvider =
    StateNotifierProvider<FavoritesController, FavoritesState>((ref) {
  return FavoritesController(ref);
});

final favoriteProductsProvider = FutureProvider<List<AppProduct>>((ref) async {
  final favorites = ref.watch(favoritesControllerProvider);
  if (favorites.ids.isEmpty) return const <AppProduct>[];

  final ids = favorites.ids.toList(growable: false);
  final productsById =
      await ref.watch(productsRepositoryProvider).fetchProductsByIds(ids);

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

class FavoritesController extends StateNotifier<FavoritesState> {
  FavoritesController(this._ref) : super(const FavoritesState()) {
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      (event) => _handleAuthChange(event.session?.user.id),
    );
    _handleAuthChange(_supabase.auth.currentUser?.id);
  }

  static const _storageKey = 'lessence_favorites';

  final Ref _ref;
  late final SupabaseClient _supabase = _ref.read(supabaseClientProvider);
  StreamSubscription<AuthState>? _authSubscription;
  String? _lastUserId;

  Future<void> _handleAuthChange(String? userId) async {
    final previousUserId = _lastUserId;
    _lastUserId = userId;

    if (userId != null && previousUserId == null) {
      await _syncGuestToServer(userId);
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

      final rows = await _supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId);

      final ids = (rows as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map((row) => row['product_id'] as String?)
          .whereType<String>()
          .toSet();

      state = state.copyWith(
        ids: ids,
        isLoading: false,
        isSyncing: false,
        clearError: true,
      );
      await _writeLocalFavorites(ids.toList(growable: false));
    } on PostgrestException catch (error) {
      state = state.copyWith(isLoading: false, isSyncing: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
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

    state = state.copyWith(ids: nextIds, isSyncing: true, clearError: true);
    await _writeLocalFavorites(nextIds.toList(growable: false));

    if (userId == null) {
      state = state.copyWith(isSyncing: false);
      return;
    }

    try {
      if (wasFavorite) {
        await _supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
      } else {
        await _supabase.from('favorites').insert(<String, dynamic>{
          'user_id': userId,
          'product_id': productId,
        });
      }

      state = state.copyWith(isSyncing: false, clearError: true);
    } on PostgrestException {
      state = state.copyWith(
        ids: state.ids.contains(productId)
            ? <String>{...state.ids}..remove(productId)
            : <String>{...state.ids}..add(productId),
        isSyncing: false,
        errorMessage: error.message,
      );
      await _writeLocalFavorites(state.ids.toList(growable: false));
    } catch (_) {
      state = state.copyWith(
        ids: state.ids.contains(productId)
            ? <String>{...state.ids}..remove(productId)
            : <String>{...state.ids}..add(productId),
        isSyncing: false,
        errorMessage: 'Failed to update favorites',
      );
      await _writeLocalFavorites(state.ids.toList(growable: false));
    }
  }

  Future<void> _syncGuestToServer(String userId) async {
    final guestIds = await _readLocalFavorites();
    if (guestIds.isEmpty) return;

    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final rows = guestIds
          .map((id) => <String, dynamic>{'user_id': userId, 'product_id': id})
          .toList(growable: false);
      await _supabase.from('favorites').upsert(
            rows,
            onConflict: 'user_id,product_id',
          );
      await _writeLocalFavorites(const <String>[]);
      state = state.copyWith(isSyncing: false);
    } catch (_) {
      state = state.copyWith(isSyncing: false);
    }
  }

  Future<List<String>> _readLocalFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return const <String>[];

    try {
      final decoded = jsonDecode(raw);
      if (decoded is List<dynamic>) {
        return decoded.whereType<String>().toList(growable: false);
      }
    } catch (_) {
      return const <String>[];
    }
    return const <String>[];
  }

  Future<void> _writeLocalFavorites(List<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(ids));
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
