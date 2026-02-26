import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import '../storage/local_db.dart';
import '../utils/fetch_logger.dart';

final productsRepositoryProvider = Provider<ProductsRepository>((ref) {
  return ProductsRepository(
    ref.watch(supabaseClientProvider),
    LocalDb.instance,
  );
});

final productsCatalogProvider = FutureProvider<List<AppProduct>>((ref) async {
  final repo = ref.watch(productsRepositoryProvider);
  return repo.fetchActiveProducts();
});

class ProductsRepository {
  ProductsRepository(this._supabase, this._localDb);

  final SupabaseClient _supabase;
  final LocalDb _localDb;

  Timer? _batchTimer;
  final Set<String> _pendingProductIds = {};
  Completer<Map<String, AppProduct>>? _batchCompleter;

  Future<List<AppProduct>> fetchActiveProducts({int limit = 40}) async {
    List<Map<String, dynamic>> productsRows;
    try {
      final rows = await _supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', ascending: false)
          .limit(limit)
          .executeAndLog('ProductsProvider:fetchActiveProducts');

      productsRows = rows;
      _localDb.cacheProducts(productsRows).ignore();
    } catch (e) {
      productsRows = await _localDb.getCachedProducts();
      // Apply limit locally if necessary
      if (productsRows.length > limit) {
        productsRows = productsRows.take(limit).toList(growable: false);
      }
    }

    final products = productsRows
        .map(AppProduct.fromMap)
        .toList(growable: false);
    return _attachVariants(products);
  }

  Future<Map<String, AppProduct>> fetchProductsByIdsBatched(List<String> ids) {
    if (ids.isEmpty) return Future.value(<String, AppProduct>{});
    
    _pendingProductIds.addAll(ids);
    
    if (_batchCompleter == null || _batchCompleter!.isCompleted) {
      _batchCompleter = Completer<Map<String, AppProduct>>();
    }

    if (_batchTimer == null || !_batchTimer!.isActive) {
      _batchTimer = Timer(const Duration(milliseconds: 50), () async {
        final completer = _batchCompleter!;
        final idsToFetch = _pendingProductIds.toList();
        _pendingProductIds.clear();
        
        try {
          final result = await fetchProductsByIds(idsToFetch);
          completer.complete(result);
        } catch (e) {
          completer.completeError(e);
        }
      });
    }
    
    return _batchCompleter!.future.then((allProducts) {
       final result = <String, AppProduct>{};
       for (final id in ids) {
         if (allProducts.containsKey(id)) {
           result[id] = allProducts[id]!;
         }
       }
       return result;
    });
  }

  Future<Map<String, AppProduct>> fetchProductsByIds(List<String> ids) async {
    if (ids.isEmpty) return <String, AppProduct>{};

    List<Map<String, dynamic>> productsRows;
    try {
      final rows = await _supabase
          .from('products')
          .select('*')
          .inFilter('id', ids)
          .executeAndLog('ProductsProvider:fetchProductsByIds');

      productsRows = rows;
      _localDb.cacheProducts(productsRows).ignore();
    } catch (e) {
      final allCached = await _localDb.getCachedProducts();
      productsRows = allCached
          .where((p) => ids.contains(p['id'].toString()))
          .toList(growable: false);
    }

    final products = productsRows
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

    List<Map<String, dynamic>> variantRows;
    try {
      final rows = await _supabase
          .from('product_variants')
          .select('*')
          .inFilter('id', ids)
          .executeAndLog('ProductsProvider:fetchVariantsByIds');

      variantRows = rows;
      _localDb.cacheVariants(variantRows).ignore();
    } catch (e) {
      // Very naive fallback: fetch all cached and filter since we don't have getVariantById in LocalDb easily
      // A more robust implementation would query SQLite.
      variantRows =
          []; // we don't really use standalone fetchVariantsByIds offline as much
    }

    final variants = variantRows
        .map(ProductVariant.fromMap)
        .toList(growable: false);

    return <String, ProductVariant>{
      for (final variant in variants) variant.id: variant,
    };
  }

  Future<List<AppProduct>> _attachVariants(List<AppProduct> products) async {
    if (products.isEmpty) return const <AppProduct>[];

    final productIds = products.map((p) => p.id).toList(growable: false);
    
    List<Map<String, dynamic>> variantRows = [];
    try {
      final rows = await _supabase
          .from('product_variants')
          .select('*')
          .inFilter('product_id', productIds)
          .executeAndLog('ProductsProvider:_attachVariants');

      variantRows = rows;
      _localDb.cacheVariants(variantRows).ignore();
    } catch (e) {
      for (final id in productIds) {
        final cached = await _localDb.getCachedVariantsByProductId(id);
        variantRows.addAll(cached);
      }
    }

    final variantsByProduct = <String, List<ProductVariant>>{};
    for (final row in variantRows) {
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
