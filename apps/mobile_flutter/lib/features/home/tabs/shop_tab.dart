import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../catalog/data/catalog_repository.dart';
import '../../catalog/models/catalog_models.dart';
import '../../catalog/widgets/catalog_state_views.dart';
import '../../catalog/widgets/product_card_tile.dart';

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
      onRefresh: () async => _reload(),
      child: FutureBuilder<HomeCatalogData>(
        future: _homeFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const ListView(
              children: [
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
            return const ListView(
              padding: EdgeInsets.all(16),
              children: [
                CatalogEmptyView(
                  title: 'No catalog data',
                  subtitle: 'Please try again later.',
                  compact: true,
                ),
              ],
            );
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Featured & New Arrivals',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => context.push('/catalog'),
                    icon: const Icon(Icons.search),
                    label: const Text('Search'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _CategoryQuickChips(
                categories: data.categories,
                onTapCategory: (slug) => context.push(
                  '/catalog?category=${Uri.encodeQueryComponent(slug)}',
                ),
              ),
              const SizedBox(height: 20),
              _SectionHeader(
                title: 'New arrivals',
                actionLabel: 'View all',
                onAction: () => context.push('/catalog'),
              ),
              const SizedBox(height: 10),
              _HorizontalProducts(
                products: data.newArrivals,
                onTapProduct: _openProduct,
                emptyTitle: 'No new arrivals yet',
                emptySubtitle: 'New products will show here.',
              ),
              const SizedBox(height: 20),
              _SectionHeader(
                title: 'Featured',
                actionLabel: 'Browse catalog',
                onAction: () => context.push('/catalog'),
              ),
              const SizedBox(height: 10),
              _HorizontalProducts(
                products: data.featured,
                onTapProduct: _openProduct,
                emptyTitle: 'No featured products',
                emptySubtitle: 'Featured items are unavailable right now.',
              ),
            ],
          );
        },
      ),
    );
  }
}

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
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
        TextButton(onPressed: onAction, child: Text(actionLabel)),
      ],
    );
  }
}

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
      height: 300,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: products.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final product = products[index];
          return CatalogProductCard(
            width: 190,
            product: product,
            onTap: () => onTapProduct(product),
          );
        },
      ),
    );
  }
}

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
            onPressed: () => onTapCategory(category.slug),
          ),
      ],
    );
  }
}
