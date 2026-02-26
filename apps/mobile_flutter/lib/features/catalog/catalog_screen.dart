import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_colors.dart';
import 'data/catalog_repository.dart';
import 'models/catalog_models.dart';
import 'widgets/catalog_state_views.dart';
import 'widgets/product_card_tile.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

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
        color: AppColors.primary,
        onRefresh: _onRefresh,
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Search bar ──────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                        boxShadow: AppColors.shadowSm,
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        textInputAction: TextInputAction.search,
                        decoration: InputDecoration(
                          hintText: 'Search fragrances',
                          prefixIcon: const Icon(
                            LucideIcons.search,
                            color: AppColors.foregroundFaint,
                          ),
                          suffixIcon: _searchController.text.isEmpty
                              ? null
                              : IconButton(
                                  icon: const Icon(LucideIcons.x),
                                  onPressed: () {
                                    _searchController.clear();
                                    _loadProducts(reset: true);
                                    setState(() {});
                                  },
                                ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 14,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _buildCategories(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            if (_initialLoading)
              const SliverToBoxAdapter(
                child: SizedBox(
                  height: 220,
                  child: CatalogLoadingView(message: 'Loading products...'),
                ),
              )
            else if (_productsError != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: CatalogErrorView(
                    message: _productsError!,
                    onRetry: () => _loadProducts(reset: true),
                    compact: true,
                  ),
                ),
              )
            else if (_products.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: CatalogEmptyView(
                    title: 'No products found',
                    subtitle: 'Try a different search or category.',
                    icon: LucideIcons.search_x,
                    actionLabel: 'Clear filters',
                    onAction: () {
                      _searchController.clear();
                      setState(() {
                        _selectedCategorySlug = 'all';
                      });
                      _loadProducts(reset: true);
                    },
                    compact: true,
                  ),
                ),
              )
            else ...[
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_products.length}${_hasMore ? '+' : ''} results',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.foregroundFaint,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                    childAspectRatio: 0.62,
                  ),
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final product = _products[index];
                    return CatalogProductCard(
                      product: product,
                      onTap: () => _openProduct(product),
                    );
                  },
                    childCount: _products.length,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_loadingMore)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: AppColors.primary,
                            ),
                          ),
                        )
                      else if (_hasMore)
                        OutlinedButton.icon(
                          onPressed: () => _loadProducts(reset: false),
                          icon: const Icon(LucideIcons.chevron_down),
                          label: const Text('Load more'),
                        ),
                    ],
                  ),
                ),
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
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            ),
          ),
        ),
      );
    }

    if (_categoriesError != null) {
      return CatalogInlineMessageCard(
        child: Row(
          children: [
            const Icon(
              LucideIcons.triangle_alert,
              size: 18,
              color: AppColors.warning,
            ),
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
                label: Text(
                  item.label,
                  style: TextStyle(
                    color: _selectedCategorySlug == item.slug
                        ? AppColors.primary
                        : AppColors.foreground,
                    fontWeight: _selectedCategorySlug == item.slug
                        ? FontWeight.w600
                        : FontWeight.w500,
                  ),
                ),
                selected: _selectedCategorySlug == item.slug,
                selectedColor: AppColors.primaryMuted,
                backgroundColor: AppColors.surface,
                side: BorderSide(
                  color: _selectedCategorySlug == item.slug
                      ? AppColors.primary.withValues(alpha: 0.3)
                      : AppColors.border,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                ),
                showCheckmark: false,
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
