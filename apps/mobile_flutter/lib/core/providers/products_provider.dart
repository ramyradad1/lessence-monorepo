import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';

final productsRepositoryProvider = Provider<ProductsRepository>((ref) {
  return ProductsRepository(ref.watch(supabaseClientProvider));
});

final productsCatalogProvider = FutureProvider<List<AppProduct>>((ref) async {
  final repo = ref.watch(productsRepositoryProvider);
  return repo.fetchActiveProducts();
});

class ProductsRepository {
  ProductsRepository(this._supabase);

  final SupabaseClient _supabase;

  Future<List<AppProduct>> fetchActiveProducts({int limit = 40}) async {
    final rows = await _supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', ascending: false)
        .limit(limit);

    final products = (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(AppProduct.fromMap)
        .toList(growable: false);

    return _attachVariants(products);
  }

  Future<Map<String, AppProduct>> fetchProductsByIds(List<String> ids) async {
    if (ids.isEmpty) return <String, AppProduct>{};

    final rows = await _supabase
        .from('products')
        .select('*')
        .inFilter('id', ids);

    final products = (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(AppProduct.fromMap)
        .toList(growable: false);

    final withVariants = await _attachVariants(products);
    return <String, AppProduct>{
      for (final product in withVariants) product.id: product,
    };
  }

  Future<Map<String, ProductVariant>> fetchVariantsByIds(
    List<String> ids,
  ) async {
    if (ids.isEmpty) return <String, ProductVariant>{};

    final rows = await _supabase
        .from('product_variants')
        .select('*')
        .inFilter('id', ids);

    final variants = (rows as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(ProductVariant.fromMap)
        .toList(growable: false);

    return <String, ProductVariant>{
      for (final variant in variants) variant.id: variant,
    };
  }

  Future<List<AppProduct>> _attachVariants(List<AppProduct> products) async {
    if (products.isEmpty) return const <AppProduct>[];

    final productIds = products.map((p) => p.id).toList(growable: false);
    final rows = await _supabase
        .from('product_variants')
        .select('*')
        .inFilter('product_id', productIds);

    final variantsByProduct = <String, List<ProductVariant>>{};
    for (final row
        in (rows as List<dynamic>).whereType<Map<String, dynamic>>()) {
      final productId = row['product_id'] as String?;
      if (productId == null) continue;
      variantsByProduct
          .putIfAbsent(productId, () => <ProductVariant>[])
          .add(ProductVariant.fromMap(row));
    }

    return products
        .map((product) {
          final variants =
              variantsByProduct[product.id]
                  ?.where((variant) => variant.isActive)
                  .toList(growable: false) ??
              const <ProductVariant>[];
          return product.copyWith(variants: variants);
        })
        .toList(growable: false);
  }
}
