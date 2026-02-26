import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'local_db.dart';
import '../providers/favorites_provider.dart';
import '../providers/cart_provider.dart';

final isOnlineProvider = NotifierProvider<IsOnlineNotifier, bool>(IsOnlineNotifier.new);

class IsOnlineNotifier extends Notifier<bool> {
  StreamSubscription? _sub;

  @override
  bool build() {
    _init();
    return true;
  }

  void _init() {
    Connectivity().checkConnectivity().then(_updateState);
    _sub = Connectivity().onConnectivityChanged.listen(_updateState);
    ref.onDispose(() {
      _sub?.cancel();
    });
  }

  void _updateState(List<ConnectivityResult> results) {
    state = results.contains(ConnectivityResult.mobile) || 
            results.contains(ConnectivityResult.wifi) || 
            results.contains(ConnectivityResult.ethernet) ||
            results.contains(ConnectivityResult.vpn) ||
            results.contains(ConnectivityResult.other);
  }
}

final syncServiceProvider = Provider<SyncService>((ref) {
  final service = SyncService(
    Supabase.instance.client, 
    LocalDb.instance,
    ref.watch(favoritesRepositoryProvider),
    ref.watch(cartRepositoryProvider),
  );
  ref.onDispose(() => service.dispose());
  return service;
});

class SyncService {
  SyncService(this._supabase, this._localDb, this._favoritesRepository, this._cartRepository) {
    _initConnectivityListener();
  }

  final SupabaseClient _supabase;
  final LocalDb _localDb;
  final FavoritesRepository _favoritesRepository;
  final CartRepository _cartRepository;
  StreamSubscription? _connectivitySub;
  bool _isFlushing = false;

  void _initConnectivityListener() {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = results.contains(ConnectivityResult.mobile) || 
                       results.contains(ConnectivityResult.wifi) || 
                       results.contains(ConnectivityResult.ethernet);
      
      if (isOnline) {
        flushQueue();
      }
    });
  }

  Future<void> enqueueAction(String action, Map<String, dynamic> payload) async {
    await _localDb.enqueueSyncAction(action, payload);
    
    // Try to sync immediately if online
    final results = await Connectivity().checkConnectivity();
    final isOnline = results.contains(ConnectivityResult.mobile) || 
                     results.contains(ConnectivityResult.wifi) || 
                     results.contains(ConnectivityResult.ethernet);
    if (isOnline) {
      flushQueue();
    }
  }

  Future<void> flushQueue() async {
    if (_isFlushing) return;
    _isFlushing = true;

    try {
      final queue = await _localDb.getSyncQueue();
      for (final item in queue) {
        final id = item['id'] as int;
        final action = item['action'] as String;
        final payload = jsonDecode(item['payload'] as String) as Map<String, dynamic>;

        try {
          await _processAction(action, payload);
          await _localDb.removeSyncAction(id);
        } catch (e) {
          debugPrint('Failed to sync action \$id: \$e');
          await _localDb.incrementRetryCount(id);
        }
      }
    } finally {
      _isFlushing = false;
    }
  }

  Future<void> _processAction(String action, Map<String, dynamic> payload) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return; // Cannot sync user context actions if not logged in

    switch (action) {
      case 'add_favorite':
        await _favoritesRepository.addFavorite(userId, payload['product_id'] as String);
        break;
      case 'remove_favorite':
        await _favoritesRepository.removeFavorite(userId, payload['product_id'] as String);
        break;
      case 'sync_cart':
        final cartId = await _cartRepository.ensureUserCartId(userId);
        
        final cartItems = (payload['items'] as List<dynamic>).map((e) {
          final itemMap = e as Map<String, dynamic>;
          return <String, dynamic>{
            'cart_id': cartId,
            'product_id': itemMap['productId'],
            'variant_id': itemMap['variantId'],
            'quantity': itemMap['quantity'],
            'selected_size': itemMap['selectedSize'],
          };
        }).toList(growable: false);

        await _cartRepository.replaceServerCartItems(cartId, cartItems);
        break;
      default:
        debugPrint('Unknown sync action: \$action');
        break;
    }
  }

  void dispose() {
    _connectivitySub?.cancel();
  }
}
