import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../data/repositories/products_repository.dart';
import '../models/admin_product_model.dart';

final adminProductsRepositoryProvider = Provider<AdminProductsRepository>((ref) {
  return AdminProductsRepository(ref.watch(supabaseClientProvider));
});

class AdminProductsRepository {
  AdminProductsRepository(this._supabase);
  final SupabaseClient _supabase;

  Future<void> checkAdminAccess() async {
    final userResult = await _supabase.from('profiles').select('role').eq('id', _supabase.auth.currentUser!.id).maybeSingle();
    final role = userResult?['role'];
    if (role != 'admin' && role != 'super_admin' && role != 'content_manager' && role != 'inventory_manager') {
      throw Exception('Unauthorized');
    }
  }

  Future<List<AdminProduct>> fetchProducts() async {
    await checkAdminAccess();
    final response = await _supabase
        .from('products')
        .select()
        .order('created_at', ascending: false);

    return (response as List<dynamic>)
        .map((e) => AdminProduct.fromMap(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> deleteProduct(String id) async {
    await _supabase.from('products').delete().eq('id', id);
  }

  Future<void> updateProductStatus(String id, String status, bool isActive) async {
    await _supabase.from('products').update({
      'status': status,
      'is_active': isActive,
    }).eq('id', id);
  }

  Future<Map<String, dynamic>> fetchProductDetails(String productId) async {
    if (productId.isEmpty) {
      return {'product': null, 'variants': <AdminProductVariant>[], 'images': <AdminProductImage>[]};
    }

    final responses = await Future.wait([
      _supabase.from('products').select().eq('id', productId).single(),
      _supabase.from('product_variants').select().eq('product_id', productId).order('size_ml', ascending: true),
      _supabase.from('product_images').select().eq('product_id', productId).order('sort_order', ascending: true),
    ]);

    final productData = responses[0] as Map<String, dynamic>;
    final variantsData = responses[1] as List<dynamic>;
    final imagesData = responses[2] as List<dynamic>;

    return {
      'product': AdminProduct.fromMap(productData),
      'variants': variantsData.map((e) => AdminProductVariant.fromMap(e as Map<String, dynamic>)).toList(),
      'images': imagesData.map((e) => AdminProductImage.fromMap(e as Map<String, dynamic>)).toList(),
    };
  }

  Future<String> saveProduct(String? productId, Map<String, dynamic> productData) async {
    if (productId != null) {
      await _supabase.from('products').update(productData).eq('id', productId);
      return productId;
    } else {
      final result = await _supabase.from('products').insert(productData).select('id').single();
      return result['id'] as String;
    }
  }

  Future<void> saveVariants(String productId, List<Map<String, dynamic>> variants) async {
    await _supabase.from('product_variants').delete().eq('product_id', productId);
    if (variants.isNotEmpty) {
      final variantsToInsert = variants.map((v) {
        final m = Map<String, dynamic>.from(v);
        m.remove('id'); // Let DB generate IDs
        m['product_id'] = productId;
        return m;
      }).toList();
      await _supabase.from('product_variants').insert(variantsToInsert);
    }
  }
}

final adminProductsProvider = AsyncNotifierProvider<AdminProductsNotifier, List<AdminProduct>>(
  AdminProductsNotifier.new,
);

class AdminProductsNotifier extends AsyncNotifier<List<AdminProduct>> {
  int _currentPage = 1;
  static const int _pageSize = 20;
  bool _hasMore = true;

  @override
  Future<List<AdminProduct>> build() async {
    _currentPage = 1;
    _hasMore = true;
    return _fetchProducts(page: _currentPage);
  }

  Future<List<AdminProduct>> _fetchProducts({required int page, bool forceRefresh = false}) async {
    final repository = ref.watch(productsRepositoryProvider);
    final response = await repository.getProducts(
      page: page,
      pageSize: _pageSize,
      forceRefresh: forceRefresh,
    );

    if (response.length < _pageSize) {
      _hasMore = false;
    }

    return response.map((e) => AdminProduct.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    _currentPage = 1;
    _hasMore = true;
    state = await AsyncValue.guard(() => _fetchProducts(page: _currentPage, forceRefresh: true));
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading || state.isReloading) return;
    
    final currentList = state.asData?.value ?? [];
    _currentPage++;
    
    try {
      final newList = await _fetchProducts(page: _currentPage);
      state = AsyncData([...currentList, ...newList]);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> deleteProduct(String id) async {
    await ref.read(productsRepositoryProvider).deleteProduct(id);
    await refresh();
  }

  Future<void> updateProductStatus(String id, String status, bool isActive) async {
    await ref.read(productsRepositoryProvider).updateProductStatus(id, status, isActive);
    await refresh();
  }
}

final adminProductDetailsProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, productId) async {
  return ref.watch(adminProductsRepositoryProvider).fetchProductDetails(productId);
});
