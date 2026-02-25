import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../models/catalog_models.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return CatalogRepository(supabase);
});

class CatalogRepository {
  CatalogRepository(this._supabase);

  final SupabaseClient _supabase;

  static const int defaultPageSize = 12;

  Future<HomeCatalogData> fetchHomeCatalogData() async {
    final results = await Future.wait([
      fetchCategories(),
      fetchNewArrivals(limit: 8),
      fetchFeaturedProducts(limit: 8),
    ]);

    return HomeCatalogData(
      categories: results[0] as List<CatalogCategory>,
      newArrivals: results[1] as List<CatalogProduct>,
      featured: results[2] as List<CatalogProduct>,
    );
  }

  Future<List<CatalogCategory>> fetchCategories() async {
    final data = await _supabase
        .from('categories')
        .select('*')
        .order('sort_order', ascending: true);

    return (data as List<dynamic>)
        .map((e) => CatalogCategory.fromMap(_map(e)))
        .where((e) => e.id.isNotEmpty && e.slug.isNotEmpty)
        .toList();
  }

  Future<List<CatalogProduct>> fetchNewArrivals({int limit = 8}) async {
    final data = await _supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('is_active', true)
        .eq('is_new', true)
        .order('created_at', ascending: false)
        .limit(limit);

    final items = (data as List<dynamic>)
        .map((e) => CatalogProduct.fromMap(_map(e)))
        .toList();

    if (items.isNotEmpty) {
      return items;
    }

    return fetchFeaturedProducts(limit: limit);
  }

  Future<List<CatalogProduct>> fetchFeaturedProducts({int limit = 8}) async {
    final data = await _supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('is_active', true)
        .order('rating', ascending: false)
        .order('review_count', ascending: false)
        .order('created_at', ascending: false)
        .limit(limit);

    return (data as List<dynamic>)
        .map((e) => CatalogProduct.fromMap(_map(e)))
        .toList();
  }

  Future<CatalogSearchPage> searchProducts({
    String? searchQuery,
    String? categorySlug,
    int pageIndex = 0,
    int pageSize = defaultPageSize,
  }) async {
    final normalizedSearch = (searchQuery ?? '').trim();
    final offset = pageIndex * pageSize;
    final requestSize = pageSize + 1;

    List<dynamic> rows;
    bool fromRpc = true;
    try {
      rows =
          (await _supabase
                  .rpc(
                    'search_products',
                    params: {
                      'search_query': normalizedSearch.isEmpty
                          ? null
                          : normalizedSearch,
                      'category_slugs':
                          (categorySlug == null || categorySlug == 'all')
                          ? null
                          : <String>[categorySlug],
                      'gender_targets': null,
                      'sizes': null,
                      'concentrations': null,
                      'min_price': null,
                      'max_price': null,
                      'in_stock_only': false,
                      'min_rating': null,
                      'sort_by': 'newest',
                    },
                  )
                  .range(offset, offset + requestSize - 1))
              as List<dynamic>;
    } catch (_) {
      fromRpc = false;
      rows = await _searchProductsFallback(
        searchQuery: normalizedSearch,
        categorySlug: categorySlug,
      );
    }

    final pageRows = fromRpc
        ? rows.take(pageSize).toList()
        : rows.skip(offset).take(requestSize).toList();

    final rawProducts = pageRows
        .take(pageSize)
        .map((e) => CatalogProduct.fromMap(_map(e)))
        .toList();

    final products = rawProducts.any((p) => p.variants.isNotEmpty)
        ? rawProducts
        : await _attachVariants(rawProducts);

    final hasMore = fromRpc
        ? rows.length > pageSize
        : pageRows.length > pageSize;

    return CatalogSearchPage(
      items: products,
      pageIndex: pageIndex,
      hasMore: hasMore,
    );
  }

  Future<CatalogProduct?> fetchProductBySlugOrId(String slugOrId) async {
    dynamic data = await _supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('slug', slugOrId)
        .maybeSingle();

    if (data == null && _looksLikeUuid(slugOrId)) {
      data = await _supabase
          .from('products')
          .select('*, variants:product_variants(*)')
          .eq('id', slugOrId)
          .maybeSingle();
    }

    if (data == null) return null;

    var product = CatalogProduct.fromMap(_map(data));
    product = await _attachProductImages(product);
    return product;
  }

  Future<List<CatalogProduct>> fetchRelatedProducts(
    CatalogProduct product, {
    int limit = 4,
  }) async {
    if (product.id.isEmpty || product.categoryId.isEmpty) {
      return const <CatalogProduct>[];
    }

    try {
      final data = await _supabase.rpc(
        'get_related_products',
        params: {
          'p_product_id': product.id,
          'p_category_id': product.categoryId,
          'p_price': product.minAvailablePrice,
          'p_scent_profiles': product.scentProfiles
              .map(
                (e) => {
                  'name': e.name,
                  if ((e.nameEn ?? '').isNotEmpty) 'name_en': e.nameEn,
                  if ((e.nameAr ?? '').isNotEmpty) 'name_ar': e.nameAr,
                  if ((e.icon ?? '').isNotEmpty) 'icon': e.icon,
                },
              )
              .toList(),
          'p_limit': limit,
        },
      );

      final related = (data as List<dynamic>)
          .map((e) => CatalogProduct.fromMap(_map(e)))
          .where((e) => e.id != product.id)
          .toList();
      return _attachVariants(related);
    } catch (_) {
      final data = await _supabase
          .from('products')
          .select('*, variants:product_variants(*)')
          .eq('is_active', true)
          .eq('category_id', product.categoryId)
          .neq('id', product.id)
          .order('rating', ascending: false)
          .order('review_count', ascending: false)
          .limit(limit);

      return (data as List<dynamic>)
          .map((e) => CatalogProduct.fromMap(_map(e)))
          .toList();
    }
  }

  Future<List<CatalogProduct>> _attachVariants(
    List<CatalogProduct> products,
  ) async {
    if (products.isEmpty) return const <CatalogProduct>[];

    final ids = products.map((e) => e.id).where((e) => e.isNotEmpty).toList();
    if (ids.isEmpty) return products;

    try {
      final variantsData = await _supabase
          .from('product_variants')
          .select('*')
          .inFilter('product_id', ids)
          .eq('is_active', true);

      final grouped = <String, List<CatalogVariant>>{};
      for (final row in (variantsData as List<dynamic>)) {
        final map = _map(row);
        final productId = (map['product_id'] ?? '').toString();
        final matchingProduct = products.cast<CatalogProduct?>().firstWhere(
          (p) => p?.id == productId,
          orElse: () => null,
        );
        final variant = CatalogVariant.fromMap(
          map,
          fallbackBasePrice: matchingProduct?.price,
        );
        grouped.putIfAbsent(productId, () => <CatalogVariant>[]).add(variant);
      }

      return products
          .map(
            (product) => product.copyWith(
              variants: (grouped[product.id] ?? product.variants)
                ..sort((a, b) {
                  final sizeCompare = (a.sizeMl ?? 0).compareTo(b.sizeMl ?? 0);
                  if (sizeCompare != 0) return sizeCompare;
                  return a.price.compareTo(b.price);
                }),
            ),
          )
          .toList();
    } catch (_) {
      return products;
    }
  }

  Future<CatalogProduct> _attachProductImages(CatalogProduct product) async {
    try {
      final data = await _supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('sort_order', ascending: true);

      final images = (data as List<dynamic>)
          .map((e) => CatalogProductImage.fromMap(_map(e)))
          .where((e) => e.url.isNotEmpty)
          .toList();

      if (images.isEmpty) return product;
      return product.copyWith(productImages: images);
    } catch (_) {
      return product;
    }
  }

  Future<List<dynamic>> _searchProductsFallback({
    required String searchQuery,
    String? categorySlug,
  }) async {
    dynamic query = _supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('is_active', true)
        .order('created_at', ascending: false);

    if (categorySlug != null &&
        categorySlug.isNotEmpty &&
        categorySlug != 'all') {
      final categoryData = await _supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();
      final categoryId = (categoryData)?['id'];
      if (categoryId != null) {
        query = query.eq('category_id', categoryId);
      } else {
        return const <dynamic>[];
      }
    }

    final rows = (await query) as List<dynamic>;
    if (searchQuery.isEmpty) return rows;

    final q = searchQuery.toLowerCase();
    return rows.where((row) {
      final map = _map(row);
      final haystack = <String>[
        map['name'],
        map['name_en'],
        map['name_ar'],
        map['subtitle'],
        map['subtitle_en'],
        map['subtitle_ar'],
        map['description'],
        map['description_en'],
        map['description_ar'],
      ].whereType<Object>().map((e) => e.toString().toLowerCase()).join(' ');
      return haystack.contains(q);
    }).toList();
  }

  static Map<String, dynamic> _map(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }
    return const <String, dynamic>{};
  }

  static bool _looksLikeUuid(String value) {
    final regex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
    );
    return regex.hasMatch(value);
  }
}
