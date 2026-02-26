import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/app_colors.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../catalog/models/catalog_models.dart';
import '../../catalog/widgets/catalog_state_views.dart';
import '../../catalog/widgets/product_card_tile.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

class ShopTab extends ConsumerStatefulWidget {
  const ShopTab({super.key});

  @override
  ConsumerState<ShopTab> createState() => _ShopTabState();
}

class _ShopTabState extends ConsumerState<ShopTab> {
  late Future<HomeCatalogData> _homeFuture;

  @override
  void initState() {
    super.initState();
    _homeFuture = ref.read(catalogRepositoryProvider).fetchHomeCatalogData();
  }

  void _reload() {
    setState(() {
      _homeFuture = ref.read(catalogRepositoryProvider).fetchHomeCatalogData();
    });
  }

  void _openProduct(CatalogProduct product) {
    final slugOrId = product.slug.isNotEmpty ? product.slug : product.id;
    context.push('/product/${Uri.encodeComponent(slugOrId)}');
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async => _reload(),
      child: FutureBuilder<HomeCatalogData>(
        future: _homeFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return ListView(
              children: const [
                SizedBox(
                  height: 260,
                  child: CatalogLoadingView(message: 'Loading catalog...'),
                ),
              ],
            );
          }

          if (snapshot.hasError) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                CatalogErrorView(
                  message: snapshot.error.toString(),
                  onRetry: _reload,
                  compact: true,
                ),
              ],
            );
          }

          final data = snapshot.data;
          if (data == null) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: const [
                CatalogEmptyView(
                  title: 'No catalog data',
                  subtitle: 'Please try again later.',
                  compact: true,
                ),
              ],
            );
          }

          return CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.only(
                  left: 16,
                  top: 16,
                  right: 16,
                  bottom: 120,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Hero Banner ─────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 28,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF1a1a2e),
                            Color(0xFF16213e),
                            Color(0xFF0f3460),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: AppColors.shadowLg,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Discover',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  color: AppColors.primaryLight,
                                  fontWeight: FontWeight.w400,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: 1,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your Signature Scent',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.5,
                                  height: 1.1,
                                ),
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            height: 42,
                            child: FilledButton.icon(
                              onPressed: () => context.push('/catalog'),
                              icon: const Icon(
                                LucideIcons.arrow_right,
                                color: AppColors.background,
                                size: 16,
                              ),
                              label: const Text('Browse All'),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: AppColors.background,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Category Chips ──────────────────────────
                    _CategoryQuickChips(
                      categories: data.categories,
                      onTapCategory: (slug) => context.push(
                        '/catalog?category=${Uri.encodeQueryComponent(slug)}',
                      ),
                    ),
                    const SizedBox(height: 32),

                    // ── New Arrivals ────────────────────────────
                    _SectionHeader(
                      title: 'New Arrivals',
                      actionLabel: 'View all',
                      onAction: () => context.push('/catalog'),
                    ),
                    const SizedBox(height: 16),
                    _HorizontalProducts(
                      products: data.newArrivals,
                      onTapProduct: _openProduct,
                      emptyTitle: 'No new arrivals yet',
                      emptySubtitle: 'New products will show here.',
                    ),
                    const SizedBox(height: 32),

                    // ── Featured ───────────────────────────────
                    _SectionHeader(
                      title: 'Featured',
                      actionLabel: 'Browse catalog',
                      onAction: () => context.push('/catalog'),
                    ),
                    const SizedBox(height: 16),
                    _HorizontalProducts(
                      products: data.featured,
                      onTapProduct: _openProduct,
                      emptyTitle: 'No featured products',
                      emptySubtitle:
                          'Featured items are unavailable right now.',
                    ),
                    const SizedBox(height: 24),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ── Section Header ─────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        TextButton(
          onPressed: onAction,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(actionLabel),
              const SizedBox(width: 4),
              const Icon(LucideIcons.arrow_right, size: 16),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Horizontal Products ────────────────────────────────────────────
class _HorizontalProducts extends StatelessWidget {
  const _HorizontalProducts({
    required this.products,
    required this.onTapProduct,
    required this.emptyTitle,
    required this.emptySubtitle,
  });

  final List<CatalogProduct> products;
  final ValueChanged<CatalogProduct> onTapProduct;
  final String emptyTitle;
  final String emptySubtitle;

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return CatalogEmptyView(
        title: emptyTitle,
        subtitle: emptySubtitle,
        compact: true,
      );
    }

    return SizedBox(
      height: 280,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final product = products[index];
          return CatalogProductCard(
            width: 170,
            product: product,
            onTap: () => onTapProduct(product),
          );
        },
      ),
    );
  }
}

// ── Category Quick Chips ───────────────────────────────────────────
class _CategoryQuickChips extends StatelessWidget {
  const _CategoryQuickChips({
    required this.categories,
    required this.onTapCategory,
  });

  final List<CatalogCategory> categories;
  final ValueChanged<String> onTapCategory;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return const SizedBox.shrink();
    }

    final locale = Localizations.localeOf(context);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final category in categories.take(8))
          ActionChip(
            label: Text(category.localizedName(locale)),
            avatar: const Icon(LucideIcons.layout_grid, size: 16),
            onPressed: () => onTapCategory(category.slug),
            side: const BorderSide(color: AppColors.border),
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(999),
            ),
          ),
      ],
    );
  }
}
