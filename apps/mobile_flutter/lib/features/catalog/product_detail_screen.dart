import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:cached_network_image/cached_network_image.dart';

import '../../core/utils/egp_formatter.dart';
import '../../theme/app_colors.dart';
import 'data/catalog_repository.dart';
import 'models/catalog_models.dart';
import 'widgets/catalog_state_views.dart';
import 'widgets/product_card_tile.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.slugOrId});

  final String slugOrId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  late Future<CatalogProduct?> _productFuture;
  int _selectedImageIndex = 0;
  int _selectedVariantIndex = 0;

  CatalogRepository get _repo => ref.read(catalogRepositoryProvider);

  @override
  void initState() {
    super.initState();
    _productFuture = _repo.fetchProductBySlugOrId(widget.slugOrId);
  }

  @override
  void didUpdateWidget(covariant ProductDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.slugOrId != widget.slugOrId) {
      _selectedImageIndex = 0;
      _selectedVariantIndex = 0;
      _productFuture = _repo.fetchProductBySlugOrId(widget.slugOrId);
    }
  }

  void _reload() {
    setState(() {
      _productFuture = _repo.fetchProductBySlugOrId(widget.slugOrId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<CatalogProduct?>(
      future: _productFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            appBar: _DetailAppBar(title: 'Product'),
            body: CatalogLoadingView(message: 'Loading product...'),
          );
        }

        if (snapshot.hasError) {
          return Scaffold(
            appBar: const _DetailAppBar(title: 'Product'),
            body: CatalogErrorView(
              message: snapshot.error.toString(),
              onRetry: _reload,
            ),
          );
        }

        final product = snapshot.data;
        if (product == null) {
          return Scaffold(
            appBar: const _DetailAppBar(title: 'Product'),
            body: CatalogEmptyView(
              title: 'Product not found',
              subtitle: 'The requested item is unavailable.',
              actionLabel: 'Back to catalog',
              onAction: () => context.go('/catalog'),
            ),
          );
        }

        return _ProductDetailBody(
          product: product,
          selectedImageIndex: _selectedImageIndex,
          selectedVariantIndex: _selectedVariantIndex,
          onSelectImage: (index) => setState(() => _selectedImageIndex = index),
          onSelectVariant: (index) =>
              setState(() => _selectedVariantIndex = index),
        );
      },
    );
  }
}

class _DetailAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _DetailAppBar({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return AppBar(title: Text(title));
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _ProductDetailBody extends StatelessWidget {
  const _ProductDetailBody({
    required this.product,
    required this.selectedImageIndex,
    required this.selectedVariantIndex,
    required this.onSelectImage,
    required this.onSelectVariant,
  });

  final CatalogProduct product;
  final int selectedImageIndex;
  final int selectedVariantIndex;
  final ValueChanged<int> onSelectImage;
  final ValueChanged<int> onSelectVariant;

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final title = product.localizedName(locale);
    final subtitle = product.localizedSubtitle(locale);
    final description = product.localizedDescription(locale);
    final images = product.galleryUrls;
    final safeImageIndex = images.isEmpty
        ? 0
        : (selectedImageIndex < images.length ? selectedImageIndex : 0);

    final variants = product.activeVariants;
    final safeVariantIndex = variants.isEmpty
        ? 0
        : (selectedVariantIndex < variants.length ? selectedVariantIndex : 0);
    final selectedVariant = variants.isEmpty
        ? null
        : variants[safeVariantIndex];
    final currentPrice =
        selectedVariant?.price ??
        (product.sizeOptions.isNotEmpty
            ? product.sizeOptions.first.price
            : product.price);
    final stockStatus =
        selectedVariant?.stockStatus ?? product.overallStockStatus;

    return Scaffold(
      appBar: _DetailAppBar(title: title.isEmpty ? 'Product' : title),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _ProductGallery(
                  imageUrls: images,
                  fallbackImageUrl: product.imageUrl,
                  selectedIndex: safeImageIndex,
                  onSelect: onSelectImage,
                ),
                const SizedBox(height: 24),
                Text(
                  title.isEmpty ? 'Unnamed product' : title,
                  style: Theme.of(context,
                  ).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.foreground,
                  ),
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: Theme.of(context,
                    ).textTheme.titleMedium?.copyWith(
                      color: AppColors.foregroundMuted,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        EgpFormatter.format(
                          currentPrice,
                          localeCode: locale.toLanguageTag(),
                        ),
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary, // Gold price
                            ),
                      ),
                    ),
                    _DetailStockChip(status: stockStatus),
                  ],
                ),
                if (product.rating > 0) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        LucideIcons.star,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${product.rating.toStringAsFixed(1)} • ${product.reviewCount} reviews',
                        style: Theme.of(context,
                        ).textTheme.bodyMedium?.copyWith(
                          color: AppColors.foregroundMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
                if (variants.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(
                    'Select Variant',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (var i = 0; i < variants.length; i++)
                        ChoiceChip(
                          label: Text(
                            '${variants[i].displayLabel(locale)} • ${EgpFormatter.format(variants[i].price, localeCode: locale.toLanguageTag())}',
                          ),
                          selected: safeVariantIndex == i,
                          onSelected: (_) => onSelectVariant(i),
                          selectedColor: AppColors.primary.withAlpha(50),
                          backgroundColor: AppColors.surface,
                          side: BorderSide(
                            color: safeVariantIndex == i
                                ? AppColors.primary
                                : AppColors.border,
                          ),
                          labelStyle: TextStyle(
                            color: safeVariantIndex == i
                                ? AppColors.foreground
                                : AppColors.foreground,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ],
                if (product.sizeOptions.isNotEmpty && variants.isEmpty) ...[
                  const SizedBox(height: 24),
                  Text(
                    'Select Size',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (final size in product.sizeOptions)
                        Chip(
                          label: Text(
                            '${size.size} • ${EgpFormatter.format(size.price, localeCode: locale.toLanguageTag())}',
                          ),
                          backgroundColor: AppColors.surface,
                          side: const BorderSide(color: AppColors.border),
                        ),
                    ],
                  ),
                ],
                if (product.scentProfiles.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(
                    'Scent profile',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      for (final profile in product.scentProfiles)
                        Chip(
                          avatar: (profile.icon ?? '').isNotEmpty
                              ? Text(
                                  profile.icon!,
                                  style: const TextStyle(fontSize: 14),
                                )
                              : null,
                          label: Text(profile.localizedName(locale)),
                          backgroundColor: AppColors.backgroundSubtle,
                          side: BorderSide.none,
                        ),
                    ],
                  ),
                ],
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    description,
                    style: Theme.of(context,
                    ).textTheme.bodyMedium?.copyWith(
                      height: 1.6,
                      color: AppColors.foregroundMuted,
                    ),
                  ),
                ],
                if (product.fragranceNotes?.hasContent ?? false) ...[
                  const SizedBox(height: 28),
                  Text(
                    'Fragrance notes',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _NotesSection(notes: product.fragranceNotes!),
                ],
                const SizedBox(height: 32),
                _RelatedProductsSection(currentProduct: product),
                const SizedBox(height: 16),
              ]),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).padding.bottom > 0
              ? MediaQuery.of(context).padding.bottom
              : 16,
        ),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: const [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 10,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total', style: Theme.of(context).textTheme.bodySmall),
                Text(
                  EgpFormatter.format(
                    currentPrice,
                    localeCode: locale.toLanguageTag(),
                  ),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 24),
            Expanded(
              child: SizedBox(
                height: 48,
                child: FilledButton.icon(
                  onPressed: stockStatus == StockStatus.outOfStock
                      ? null
                      : () {},
                  icon: const Icon(
                    LucideIcons.shopping_bag,
                    size: 20,
                    color: AppColors.background,
                  ),
                  label: const Text('Add to Bag'),
                  style: FilledButton.styleFrom(
                    foregroundColor: AppColors.background,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductGallery extends StatelessWidget {
  const _ProductGallery({
    required this.imageUrls,
    required this.fallbackImageUrl,
    required this.selectedIndex,
    required this.onSelect,
  });

  final List<String> imageUrls;
  final String? fallbackImageUrl;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final urls = imageUrls.isNotEmpty
        ? imageUrls
        : <String>[if ((fallbackImageUrl ?? '').isNotEmpty) fallbackImageUrl!];
    final safeIndex = urls.isEmpty
        ? 0
        : (selectedIndex < urls.length ? selectedIndex : 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            color: AppColors.surface,
          ),
          clipBehavior: Clip.antiAlias,
          child: AspectRatio(
            aspectRatio: 4 / 5,
            child: urls.isEmpty
                ? const _GalleryPlaceholder()
                : CachedNetworkImage(
                    imageUrl: urls[safeIndex],
                    fit: BoxFit.cover,
                    errorWidget: (context, url, error) =>
                        const _GalleryPlaceholder(),
                    placeholder: (context, url) => const _GalleryPlaceholder(),
                  ),
          ),
        ),
        if (urls.length > 1) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: urls.length,
              separatorBuilder: (context, index) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final isSelected = index == safeIndex;
                return InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () => onSelect(index),
                  child: Container(
                    width: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : AppColors.border,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: CachedNetworkImage(
                      imageUrl: urls[index],
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) =>
                          const _GalleryPlaceholder(),
                      placeholder: (context, url) =>
                          const _GalleryPlaceholder(),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}

class _GalleryPlaceholder extends StatelessWidget {
  const _GalleryPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundSubtle,
      alignment: Alignment.center,
      child: Icon(
        LucideIcons.image_off,
        size: 42,
        color: AppColors.foregroundFaint,
      ),
    );
  }
}

class _DetailStockChip extends StatelessWidget {
  const _DetailStockChip({required this.status});

  final StockStatus status;

  @override
  Widget build(BuildContext context) {
    late final String label;
    late final Color fg;
    late final Color bg;

    switch (status) {
      case StockStatus.inStock:
        label = 'In stock';
        fg = AppColors.success;
        bg = AppColors.successBg;
        break;
      case StockStatus.lowStock:
        label = 'Low stock';
        fg = AppColors.warning;
        bg = AppColors.warningBg;
        break;
      case StockStatus.outOfStock:
        label = 'Out of stock';
        fg = AppColors.error;
        bg = AppColors.errorBg;
        break;
      case StockStatus.unknown:
        label = 'Stock unavailable';
        fg = AppColors.foregroundMuted;
        bg = AppColors.surfaceMuted;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }
}

class _NotesSection extends StatelessWidget {
  const _NotesSection({required this.notes});

  final FragranceNotes notes;

  @override
  Widget build(BuildContext context) {
    final sections = <({String title, List<String> items})>[
      (title: 'Top', items: notes.top),
      (title: 'Heart', items: notes.heart),
      (title: 'Base', items: notes.base),
    ].where((e) => e.items.isNotEmpty).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < sections.length; i++) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sections[i].title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.foregroundMuted,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    for (final note in sections[i].items)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundSubtle,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          note,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          if (i != sections.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _RelatedProductsSection extends ConsumerStatefulWidget {
  const _RelatedProductsSection({required this.currentProduct});

  final CatalogProduct currentProduct;

  @override
  ConsumerState<_RelatedProductsSection> createState() =>
      _RelatedProductsSectionState();
}

class _RelatedProductsSectionState
    extends ConsumerState<_RelatedProductsSection> {
  late Future<List<CatalogProduct>> _future;

  CatalogRepository get _repo => ref.read(catalogRepositoryProvider);

  @override
  void initState() {
    super.initState();
    _future = _repo.fetchRelatedProducts(widget.currentProduct);
  }

  @override
  void didUpdateWidget(covariant _RelatedProductsSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentProduct.id != widget.currentProduct.id) {
      _future = _repo.fetchRelatedProducts(widget.currentProduct);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<CatalogProduct>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CatalogInlineMessageCard(
            child: SizedBox(
              height: 60,
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        if (snapshot.hasError) {
          return CatalogInlineMessageCard(
            child: Row(
              children: [
                const Icon(LucideIcons.info, size: 18),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('Related products unavailable right now.'),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _future = _repo.fetchRelatedProducts(
                        widget.currentProduct,
                      );
                    });
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        final items = snapshot.data ?? const <CatalogProduct>[];
        if (items.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You might also like',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 290,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                itemCount: items.length,
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return CatalogProductCard(
                    width: 170,
                    product: item,
                    onTap: () {
                      final slugOrId = item.slug.isNotEmpty
                          ? item.slug
                          : item.id;
                      context.push('/product/${Uri.encodeComponent(slugOrId)}');
                    },
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
