import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import 'products_provider.dart';

final cartControllerProvider = StateNotifierProvider<CartController, CartState>(
  (ref) {
    return CartController(ref);
  },
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

class CartController extends StateNotifier<CartState> {
  CartController(this._ref) : super(const CartState()) {
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      (event) => _handleAuthChange(event.session?.user.id),
    );
    _bootstrap();
  }

  static const _storageKey = 'lessence_cart';

  final Ref _ref;
  late final SupabaseClient _supabase = _ref.read(supabaseClientProvider);
  late final ProductsRepository _productsRepository = _ref.read(
    productsRepositoryProvider,
  );
  StreamSubscription<AuthState>? _authSubscription;
  String? _lastUserId;
  String? _serverCartId;
  bool _bootstrapped = false;

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
      state = state.copyWith(isSyncing: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
        isSyncing: false,
        errorMessage: 'Failed to sync cart',
      );
    }
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
      await _replaceServerCart(userId, mergedItems);

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
    final cartRow = await _supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (cartRow == null) {
      _serverCartId = null;
      return const <CartItemModel>[];
    }

    final cartMap = Map<String, dynamic>.from(cartRow as Map);
    final cartId = cartMap['id'] as String?;
    if (cartId == null) return const <CartItemModel>[];

    _serverCartId = cartId;

    final rows = await _supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

    final cartItemsRows = (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map((row) => Map<String, dynamic>.from(row))
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

    final productsById = await _productsRepository.fetchProductsByIds(
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

    final existing = await _supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (existing != null) {
      final id = (existing as Map)['id'] as String;
      _serverCartId = id;
      return id;
    }

    final created = await _supabase
        .from('carts')
        .insert(<String, dynamic>{'user_id': userId})
        .select('id')
        .single();

    final id = (created as Map)['id'] as String;
    _serverCartId = id;
    return id;
  }

  Future<void> _replaceServerCart(
    String userId,
    List<CartItemModel> items,
  ) async {
    final cartId = await _ensureUserCartId(userId);

    final existingRows = await _supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);

    final preservedBundleRows = (existingRows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .where((row) => row['bundle_id'] != null)
        .map(
          (row) => <String, dynamic>{
            'cart_id': cartId,
            'bundle_id': row['bundle_id'],
            'quantity': row['quantity'],
          },
        )
        .toList(growable: false);

    await _supabase.from('cart_items').delete().eq('cart_id', cartId);

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

    if (payload.isEmpty) return;

    await _supabase.from('cart_items').insert(payload);
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
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return const <CartItemModel>[];

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List<dynamic>) return const <CartItemModel>[];

      return decoded
          .whereType<Map>()
          .map(
            (row) =>
                CartItemModel.fromLocalJson(Map<String, dynamic>.from(row)),
          )
          .toList(growable: false);
    } catch (_) {
      return const <CartItemModel>[];
    }
  }

  Future<void> _writeLocalCart(List<CartItemModel> items) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = items
        .map((item) => item.toLocalJson())
        .toList(growable: false);
    await prefs.setString(_storageKey, jsonEncode(payload));
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}

extension _FirstOrNullExtension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
