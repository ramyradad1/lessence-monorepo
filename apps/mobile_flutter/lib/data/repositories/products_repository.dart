import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final productsRepositoryProvider = Provider<ProductsRepository>((ref) {
  return ProductsRepository(ref.read(supabaseClientProvider));
});

class ProductsRepository extends BaseRepository {
  ProductsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _productsCache = CacheManager(ttl: const Duration(minutes: 5));
  final CacheManager<Map<String, dynamic>> _singleProductCache = CacheManager(ttl: const Duration(minutes: 5));

  /// Gets paginated products (admin or storefront)
  Future<List<Map<String, dynamic>>> getProducts({
    int page = 1,
    int pageSize = 20,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'products_page_${page}_size_$pageSize';
    final offset = (page - 1) * pageSize;

    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _productsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client
            .from('products')
            .select('''
              *,
              product_variants(*),
              brand:brands(name_en, name_ar),
              category:categories(name_en, name_ar)
            ''')
            .order('created_at', ascending: false)
            .range(offset, offset + pageSize - 1);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  /// Searches products using the database RPC
  Future<List<Map<String, dynamic>>> searchProducts(String query) async {
    // Usually we don't cache search heavily if it's dynamic, 
    // but deduplication protects rapid typing requests.
    return deduplicate('search_products_$query', () async {
      final response = await client.rpc('search_products', params: {'search_term': query});
      return List<Map<String, dynamic>>.from(response);
    });
  }

  /// Admin save product using RPC
  Future<Map<String, dynamic>> adminSaveProduct(Map<String, dynamic> productData) async {
    final response = await client.rpc('admin_save_product', params: productData);
    // Invalidate caches
    _productsCache.clear();
    if (productData.containsKey('p_id') && productData['p_id'] != null) {
      _singleProductCache.remove('product_${productData['p_id']}');
    }
    return response as Map<String, dynamic>;
  }

  /// Delete product
  Future<void> deleteProduct(String id) async {
    await client.from('products').delete().eq('id', id);
    _productsCache.clear();
    _singleProductCache.remove('product_$id');
  }

  /// Update single product status
  Future<void> updateProductStatus(String id, String status, bool isActive) async {
    await client.from('products').update({
      'translation_status': status, // 'status' might be mapped to translation_status or similar if they use it for something else, but let's use is_active as core
      'is_active': isActive,
    }).eq('id', id);
    _productsCache.clear();
    _singleProductCache.remove('product_$id');
  }

  /// Bulk update product status
  Future<void> adminBulkUpdateStatus(List<String> productIds, String status) async {
    await client.rpc('admin_bulk_update_product_status', params: {
      'p_product_ids': productIds,
      'p_status': status,
    });
    _productsCache.clear();
    for (final id in productIds) {
      _singleProductCache.remove('product_$id');
    }
  }

  /// Clear caches
  void invalidateCache() {
    _productsCache.clear();
    _singleProductCache.clear();
  }
}
