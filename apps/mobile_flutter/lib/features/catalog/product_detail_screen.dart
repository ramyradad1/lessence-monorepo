import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/egp_formatter.dart';
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ProductGallery(
            imageUrls: images,
            fallbackImageUrl: product.imageUrl,
            selectedIndex: safeImageIndex,
            onSelect: onSelectImage,
          ),
          const SizedBox(height: 16),
          Text(
            title.isEmpty ? 'Unnamed product' : title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: Colors.black54),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  EgpFormatter.format(
                    currentPrice,
                    localeCode: locale.toLanguageTag(),
                  ),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _DetailStockChip(status: stockStatus),
            ],
          ),
          if (product.rating > 0) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.star_rounded, color: Color(0xFFF2B705)),
                const SizedBox(width: 4),
                Text(
                  '${product.rating.toStringAsFixed(1)} • ${product.reviewCount} reviews',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                ),
              ],
            ),
          ],
          if (variants.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Variants',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (var i = 0; i < variants.length; i++)
                  ChoiceChip(
                    label: Text(
                      '${variants[i].displayLabel(locale)} • ${EgpFormatter.format(variants[i].price, localeCode: locale.toLanguageTag())}',
                    ),
                    selected: safeVariantIndex == i,
                    onSelected: (_) => onSelectVariant(i),
                  ),
              ],
            ),
          ],
          if (product.sizeOptions.isNotEmpty && variants.isEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Sizes',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final size in product.sizeOptions)
                  Chip(
                    label: Text(
                      '${size.size} • ${EgpFormatter.format(size.price, localeCode: locale.toLanguageTag())}',
                    ),
                  ),
              ],
            ),
          ],
          if (product.scentProfiles.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Scent profile',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final profile in product.scentProfiles)
                  Chip(
                    avatar: (profile.icon ?? '').isNotEmpty
                        ? Text(
                            profile.icon!,
                            style: const TextStyle(fontSize: 12),
                          )
                        : null,
                    label: Text(profile.localizedName(locale)),
                  ),
              ],
            ),
          ],
          if (description.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Description',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(height: 1.4),
            ),
          ],
          if (product.fragranceNotes?.hasContent ?? false) ...[
            const SizedBox(height: 20),
            Text(
              'Fragrance notes',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            _NotesSection(notes: product.fragranceNotes!),
          ],
          const SizedBox(height: 24),
          _RelatedProductsSection(currentProduct: product),
          const SizedBox(height: 16),
        ],
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
        Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          child: AspectRatio(
            aspectRatio: 4 / 5,
            child: urls.isEmpty
                ? const _GalleryPlaceholder()
                : Image.network(
                    urls[safeIndex],
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _GalleryPlaceholder(),
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) return child;
                      return const _GalleryPlaceholder();
                    },
                  ),
          ),
        ),
        if (urls.length > 1) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: urls.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
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
                            ? Colors.black87
                            : Colors.grey.shade300,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.network(
                      urls[index],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const _GalleryPlaceholder(),
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
      color: Colors.grey.shade100,
      alignment: Alignment.center,
      child: Icon(Icons.image_outlined, size: 42, color: Colors.grey.shade400),
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
        fg = Colors.green.shade800;
        bg = Colors.green.shade50;
        break;
      case StockStatus.lowStock:
        label = 'Low stock';
        fg = Colors.orange.shade800;
        bg = Colors.orange.shade50;
        break;
      case StockStatus.outOfStock:
        label = 'Out of stock';
        fg = Colors.red.shade800;
        bg = Colors.red.shade50;
        break;
      case StockStatus.unknown:
        label = 'Stock unavailable';
        fg = Colors.grey.shade700;
        bg = Colors.grey.shade100;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg),
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
      children: [
        for (var i = 0; i < sections.length; i++) ...[
          CatalogInlineMessageCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sections[i].title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final note in sections[i].items)
                      Chip(label: Text(note)),
                  ],
                ),
              ],
            ),
          ),
          if (i != sections.length - 1) const SizedBox(height: 10),
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
                const Icon(Icons.info_outline, size: 18),
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
              'Related products',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 300,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return CatalogProductCard(
                    width: 180,
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
