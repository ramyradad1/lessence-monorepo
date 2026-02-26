import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import 'products_provider.dart';
import '../storage/local_db.dart';
import '../storage/sync_service.dart';
import '../utils/fetch_logger.dart';

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepository(ref.watch(supabaseClientProvider));
});

class CartRepository {
  CartRepository(this._supabase);
  final SupabaseClient _supabase;

  Future<String?> fetchCartId(String userId) async {
    final cartRow = await _supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .executeMaybeSingleAndLog('CartRepository:fetchCartId');

    if (cartRow == null) return null;
    return (cartRow as Map)['id'] as String?;
  }

  Future<List<Map<String, dynamic>>> fetchCartItems(String cartId) async {
    final rows = await _supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .executeAndLog('CartRepository:fetchCartItems');

    return (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList(growable: false);
  }

  Future<String> ensureUserCartId(String userId) async {
    final existing = await _supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (existing != null) {
      return (existing as Map)['id'] as String;
    }

    final created = await _supabase
        .from('carts')
        .insert(<String, dynamic>{'user_id': userId})
        .select('id')
        .single();

    return (created as Map)['id'] as String;
  }

  Future<void> replaceServerCartItems(
    String cartId,
    List<Map<String, dynamic>> payload,
  ) async {
    await _supabase.from('cart_items').delete().eq('cart_id', cartId);
    if (payload.isNotEmpty) {
      await _supabase.from('cart_items').insert(payload);
    }
  }
}

final cartControllerProvider = NotifierProvider<CartController, CartState>(
  CartController.new,
);

class CartState {
  const CartState({
    this.items = const <CartItemModel>[],
    this.isLoading = false,
    this.isSyncing = false,
    this.errorMessage,
  });

  final List<CartItemModel> items;
  final bool isLoading;
  final bool isSyncing;
  final String? errorMessage;

  int get itemCount => items.fold<int>(0, (sum, item) => sum + item.quantity);

  double get totalAmount => items.fold<double>(
    0,
    (sum, item) => sum + (item.unitPrice * item.quantity),
  );

  CartState copyWith({
    List<CartItemModel>? items,
    bool? isLoading,
    bool? isSyncing,
    String? errorMessage,
    bool clearError = false,
  }) {
    return CartState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      isSyncing: isSyncing ?? this.isSyncing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class CartController extends Notifier<CartState> {
  StreamSubscription<AuthState>? _authSubscription;
  String? _lastUserId;
  String? _serverCartId;
  bool _bootstrapped = false;

  SupabaseClient get _supabase => ref.read(supabaseClientProvider);
  CartRepository get _cartRepository => ref.read(cartRepositoryProvider);
  ProductsRepository get _productsRepository =>
      ref.read(productsRepositoryProvider);
  LocalDb get _localDb => LocalDb.instance;
  SyncService get _syncService => ref.read(syncServiceProvider);

  @override
  CartState build() {
    _authSubscription?.cancel();
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      (event) => _handleAuthChange(event.session?.user.id),
    );
    ref.onDispose(() {
      _authSubscription?.cancel();
    });
    Future.microtask(_bootstrap);
    return const CartState();
  }

  Future<void> _bootstrap() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final localItems = await _readLocalCart();
    state = state.copyWith(
      items: localItems,
      isLoading: false,
      clearError: true,
    );

    final userId = _supabase.auth.currentUser?.id;
    _lastUserId = userId;
    if (userId != null) {
      await _mergeLocalAndServer(userId);
    }

    _bootstrapped = true;
  }

  Future<void> _handleAuthChange(String? userId) async {
    if (!_bootstrapped) return;
    if (userId == _lastUserId) return;

    _lastUserId = userId;
    if (userId == null) {
      _serverCartId = null;
      state = state.copyWith(isSyncing: false);
      return;
    }

    await _mergeLocalAndServer(userId);
  }

  Future<void> refresh() async {
    final userId = _supabase.auth.currentUser?.id;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      if (userId == null) {
        final localItems = await _readLocalCart();
        state = state.copyWith(
          items: localItems,
          isLoading: false,
          isSyncing: false,
          clearError: true,
        );
        return;
      }

      await _mergeLocalAndServer(userId);
      state = state.copyWith(isLoading: false, clearError: true);
    } on PostgrestException catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to refresh cart',
      );
    }
  }

  Future<void> addProduct(AppProduct product) async {
    final variant = product.variants.isNotEmpty ? product.variants.first : null;
    final sizeOption = variant == null && product.sizeOptions.isNotEmpty
        ? product.sizeOptions.first
        : null;

    final line = CartItemModel(
      productId: product.id,
      quantity: 1,
      productName: product.name,
      productNameAr: product.nameAr,
      imageUrl: product.imageUrl,
      unitPrice: variant?.price ?? sizeOption?.price ?? product.price,
      selectedSize: sizeOption?.size,
      variantId: variant?.id,
      variantLabel: variant?.label(),
    );

    final next = _upsertItem(state.items, line);
    await _applyLocalChange(next);
  }

  Future<void> updateQuantity(String itemKey, int quantity) async {
    if (quantity <= 0) {
      await removeItem(itemKey);
      return;
    }

    final next = state.items
        .map(
          (item) =>
              item.key == itemKey ? item.copyWith(quantity: quantity) : item,
        )
        .toList(growable: false);
    await _applyLocalChange(next);
  }

  Future<void> removeItem(String itemKey) async {
    final next = state.items
        .where((item) => item.key != itemKey)
        .toList(growable: false);
    await _applyLocalChange(next);
  }

  Future<void> clearCart() async {
    await _applyLocalChange(const <CartItemModel>[]);
  }

  Future<void> _applyLocalChange(List<CartItemModel> next) async {
    state = state.copyWith(items: next, isSyncing: true, clearError: true);
    await _writeLocalCart(next);

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      state = state.copyWith(isSyncing: false);
      return;
    }

    try {
      await _replaceServerCart(userId, next);
      state = state.copyWith(isSyncing: false, clearError: true);
    } on PostgrestException catch (error) {
      // Offline fallback via SyncService enqueue
      await _enqueueCartSync(next);
      state = state.copyWith(isSyncing: false, errorMessage: error.message);
    } catch (_) {
      // Offline fallback 
      await _enqueueCartSync(next);
      state = state.copyWith(
        isSyncing: false,
        errorMessage: 'Added to sync queue',
      );
    }
  }

  Future<void> _enqueueCartSync(List<CartItemModel> items) async {
    await _syncService.enqueueAction('sync_cart', {
      'items': items.map((i) => i.toLocalJson()).toList(),
    });
  }

  Future<void> _mergeLocalAndServer(String userId) async {
    state = state.copyWith(isSyncing: true, clearError: true);

    try {
      final localItems = state.items;
      final serverItems = await _fetchServerCartItems(userId);
      final mergedItems = _mergeCartLists(serverItems, localItems);

      state = state.copyWith(
        items: mergedItems,
        isSyncing: true,
        clearError: true,
      );
      await _writeLocalCart(mergedItems);
      
      try {
        await _replaceServerCart(userId, mergedItems);
      } catch (e) {
        // Enqueue if offline during merge replace
        await _enqueueCartSync(mergedItems);
      }

      state = state.copyWith(isSyncing: false, clearError: true);
    } on PostgrestException catch (error) {
      state = state.copyWith(isSyncing: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
        isSyncing: false,
        errorMessage: 'Failed to merge cart',
      );
    }
  }

  Future<List<CartItemModel>> _fetchServerCartItems(String userId) async {
    final cartId = await _cartRepository.fetchCartId(userId);

    if (cartId == null) {
      _serverCartId = null;
      return const <CartItemModel>[];
    }

    _serverCartId = cartId;

    final rows = await _cartRepository.fetchCartItems(cartId);

    final cartItemsRows = rows
        .where((row) => row['product_id'] != null)
        .toList(growable: false);

    if (cartItemsRows.isEmpty) return const <CartItemModel>[];

    final productIds = cartItemsRows
        .map((row) => row['product_id'] as String?)
        .whereType<String>()
        .toSet()
        .toList(growable: false);
    final variantIds = cartItemsRows
        .map((row) => row['variant_id'] as String?)
        .whereType<String>()
        .toSet()
        .toList(growable: false);

    final productsById = await _productsRepository.fetchProductsByIdsBatched(
      productIds,
    );
    final variantsById = await _productsRepository.fetchVariantsByIds(
      variantIds,
    );

    return cartItemsRows
        .map((row) {
          final productId = (row['product_id'] ?? '') as String;
          final product = productsById[productId];
          final variantId = row['variant_id'] as String?;
          final variant = variantId == null ? null : variantsById[variantId];
          final selectedSize = row['selected_size'] as String?;

          final sizePrice = selectedSize == null
              ? null
              : product?.sizeOptions
                    .where((option) => option.size == selectedSize)
                    .firstOrNull
                    ?.price;

          return CartItemModel(
            productId: productId,
            quantity: (row['quantity'] as num?)?.toInt() ?? 1,
            productName: product?.name ?? productId,
            productNameAr: product?.nameAr,
            imageUrl: product?.imageUrl,
            unitPrice: variant?.price ?? sizePrice ?? product?.price ?? 0,
            selectedSize: selectedSize,
            variantId: variantId,
            variantLabel: variant?.label(),
          );
        })
        .toList(growable: false);
  }

  Future<String> _ensureUserCartId(String userId) async {
    if (_serverCartId != null) return _serverCartId!;
    _serverCartId = await _cartRepository.ensureUserCartId(userId);
    return _serverCartId!;
  }

  Future<void> _replaceServerCart(
    String userId,
    List<CartItemModel> items,
  ) async {
    final cartId = await _ensureUserCartId(userId);

    final existingRows = await _cartRepository.fetchCartItems(cartId);

    final preservedBundleRows = existingRows
        .where((row) => row['bundle_id'] != null)
        .map(
          (row) => <String, dynamic>{
            'cart_id': cartId,
            'bundle_id': row['bundle_id'],
            'quantity': row['quantity'],
          },
        )
        .toList(growable: false);

    final payload = items
        .map(
          (item) => <String, dynamic>{
            'cart_id': cartId,
            'product_id': item.productId,
            'selected_size': item.selectedSize,
            'variant_id': item.variantId,
            'quantity': item.quantity,
          },
        )
        .followedBy(preservedBundleRows)
        .toList(growable: false);

    await _cartRepository.replaceServerCartItems(cartId, payload);
  }

  List<CartItemModel> _mergeCartLists(
    List<CartItemModel> primary,
    List<CartItemModel> secondary,
  ) {
    final byKey = <String, CartItemModel>{};

    for (final item in [...primary, ...secondary]) {
      final existing = byKey[item.key];
      if (existing == null) {
        byKey[item.key] = item;
        continue;
      }

      byKey[item.key] = existing.copyWith(
        quantity: existing.quantity + item.quantity,
        productName: existing.productName.isNotEmpty
            ? existing.productName
            : item.productName,
        productNameAr: existing.productNameAr ?? item.productNameAr,
        imageUrl: existing.imageUrl ?? item.imageUrl,
        unitPrice: existing.unitPrice == 0
            ? item.unitPrice
            : existing.unitPrice,
        selectedSize: existing.selectedSize ?? item.selectedSize,
        variantId: existing.variantId ?? item.variantId,
        variantLabel: existing.variantLabel ?? item.variantLabel,
      );
    }

    return byKey.values.toList(growable: false);
  }

  List<CartItemModel> _upsertItem(
    List<CartItemModel> items,
    CartItemModel nextItem,
  ) {
    final index = items.indexWhere((item) => item.key == nextItem.key);
    if (index == -1) {
      return <CartItemModel>[...items, nextItem];
    }

    final updated = [...items];
    final current = updated[index];
    updated[index] = current.copyWith(
      quantity: current.quantity + nextItem.quantity,
    );
    return updated;
  }

  Future<List<CartItemModel>> _readLocalCart() async {
    final mapList = await _localDb.getLocalCart();
    return mapList.map(CartItemModel.fromLocalJson).toList();
  }

  Future<void> _writeLocalCart(List<CartItemModel> items) async {
    final payload = items
        .map((item) => item.toLocalJson())
        .toList(growable: false);
    await _localDb.saveLocalCart(payload);
  }
}

extension _FirstOrNullExtension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

