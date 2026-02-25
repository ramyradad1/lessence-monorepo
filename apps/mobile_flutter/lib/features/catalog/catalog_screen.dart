import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'data/catalog_repository.dart';
import 'models/catalog_models.dart';
import 'widgets/catalog_state_views.dart';
import 'widgets/product_card_tile.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key, this.initialCategorySlug});

  final String? initialCategorySlug;

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  static const int _pageSize = 12;

  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  bool _categoriesLoading = true;
  String? _categoriesError;
  List<CatalogCategory> _categories = const <CatalogCategory>[];
  String _selectedCategorySlug = 'all';

  bool _initialLoading = true;
  bool _loadingMore = false;
  String? _productsError;
  List<CatalogProduct> _products = const <CatalogProduct>[];
  int _currentPage = 0;
  bool _hasMore = true;
  int _requestVersion = 0;

  CatalogRepository get _repo => ref.read(catalogRepositoryProvider);

  @override
  void initState() {
    super.initState();
    _selectedCategorySlug = widget.initialCategorySlug ?? 'all';
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    await Future.wait([_loadCategories(), _loadProducts(reset: true)]);
  }

  Future<void> _loadCategories() async {
    setState(() {
      _categoriesLoading = true;
      _categoriesError = null;
    });
    try {
      final categories = await _repo.fetchCategories();
      if (!mounted) return;
      setState(() {
        _categories = categories;
        _categoriesLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _categoriesLoading = false;
        _categoriesError = e.toString();
      });
    }
  }

  Future<void> _loadProducts({required bool reset}) async {
    if (!reset && (_loadingMore || !_hasMore)) return;

    final requestId = ++_requestVersion;
    final nextPage = reset ? 0 : _currentPage + 1;

    setState(() {
      if (reset) {
        _initialLoading = true;
        _productsError = null;
        _products = const <CatalogProduct>[];
        _currentPage = 0;
        _hasMore = true;
      } else {
        _loadingMore = true;
      }
    });

    try {
      final result = await _repo.searchProducts(
        searchQuery: _searchController.text,
        categorySlug: _selectedCategorySlug,
        pageIndex: nextPage,
        pageSize: _pageSize,
      );
      if (!mounted || requestId != _requestVersion) return;
      setState(() {
        _products = reset
            ? result.items
            : <CatalogProduct>[..._products, ...result.items];
        _currentPage = result.pageIndex;
        _hasMore = result.hasMore;
      });
    } catch (e) {
      if (!mounted || requestId != _requestVersion) return;
      setState(() {
        _productsError = e.toString();
      });
    } finally {
      if (mounted && requestId == _requestVersion) {
        setState(() {
          _initialLoading = false;
          _loadingMore = false;
        });
      }
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      _loadProducts(reset: true);
    });
    setState(() {});
  }

  Future<void> _onRefresh() async {
    await _loadInitial();
  }

  void _openProduct(CatalogProduct product) {
    final slugOrId = product.slug.isNotEmpty ? product.slug : product.id;
    context.push('/product/${Uri.encodeComponent(slugOrId)}');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Catalog')),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search fragrances',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _searchController.clear();
                          _loadProducts(reset: true);
                          setState(() {});
                        },
                      ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            _buildCategories(),
            const SizedBox(height: 16),
            if (_initialLoading)
              const SizedBox(
                height: 220,
                child: CatalogLoadingView(message: 'Loading products...'),
              )
            else if (_productsError != null)
              CatalogErrorView(
                message: _productsError!,
                onRetry: () => _loadProducts(reset: true),
                compact: true,
              )
            else if (_products.isEmpty)
              CatalogEmptyView(
                title: 'No products found',
                subtitle: 'Try a different search or category.',
                icon: Icons.search_off,
                actionLabel: 'Clear filters',
                onAction: () {
                  _searchController.clear();
                  setState(() {
                    _selectedCategorySlug = 'all';
                  });
                  _loadProducts(reset: true);
                },
                compact: true,
              )
            else ...[
              Text(
                '${_products.length}${_hasMore ? '+' : ''} results',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.black54),
              ),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.62,
                ),
                itemCount: _products.length,
                itemBuilder: (context, index) {
                  final product = _products[index];
                  return CatalogProductCard(
                    product: product,
                    onTap: () => _openProduct(product),
                  );
                },
              ),
              const SizedBox(height: 12),
              if (_loadingMore)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_hasMore)
                OutlinedButton.icon(
                  onPressed: () => _loadProducts(reset: false),
                  icon: const Icon(Icons.expand_more),
                  label: const Text('Load more'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCategories() {
    if (_categoriesLoading) {
      return const SizedBox(
        height: 40,
        child: Align(
          alignment: Alignment.centerLeft,
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    if (_categoriesError != null) {
      return CatalogInlineMessageCard(
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Categories failed to load',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            TextButton(onPressed: _loadCategories, child: const Text('Retry')),
          ],
        ),
      );
    }

    final locale = Localizations.localeOf(context);
    final items = <_CategoryChipItem>[
      const _CategoryChipItem(slug: 'all', label: 'All'),
      ..._categories.map(
        (e) => _CategoryChipItem(slug: e.slug, label: e.localizedName(locale)),
      ),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final item in items)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: ChoiceChip(
                label: Text(item.label),
                selected: _selectedCategorySlug == item.slug,
                onSelected: (_) {
                  setState(() {
                    _selectedCategorySlug = item.slug;
                  });
                  _loadProducts(reset: true);
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryChipItem {
  const _CategoryChipItem({required this.slug, required this.label});

  final String slug;
  final String label;
}
