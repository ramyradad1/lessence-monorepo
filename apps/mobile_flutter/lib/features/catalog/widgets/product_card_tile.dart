import 'package:flutter/material.dart';

import '../../../core/utils/egp_formatter.dart';
import '../../../core/utils/locale_utils.dart';
import '../models/catalog_models.dart';

class CatalogProductCard extends StatelessWidget {
  const CatalogProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.width,
    this.showCategory = false,
  });

  final CatalogProduct product;
  final VoidCallback? onTap;
  final double? width;
  final bool showCategory;

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final title = product.localizedName(locale);
    final subtitle = product.localizedSubtitle(locale);
    final gallery = product.galleryUrls;
    final image = gallery.isNotEmpty ? gallery.first : product.imageUrl;
    final priceLabel = EgpFormatter.format(
      product.minAvailablePrice,
      localeCode: locale.toLanguageTag(),
    );

    return SizedBox(
      width: width,
      child: Card(
        elevation: 0,
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: Colors.grey.shade200),
        ),
        child: InkWell(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 4 / 5,
                child: _ProductImage(imageUrl: image, isNew: product.isNew),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title.isEmpty ? 'Unnamed product' : title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (subtitle.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: Colors.black54),
                        ),
                      ],
                      if (showCategory &&
                          (product.categoryName ?? '').isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          product.categoryName!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(color: Colors.black45),
                        ),
                      ],
                      const Spacer(),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              priceLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          _StockBadge(status: product.overallStockStatus),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductImage extends StatelessWidget {
  const _ProductImage({required this.imageUrl, required this.isNew});

  final String? imageUrl;
  final bool isNew;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(color: Colors.grey.shade100),
        if ((imageUrl ?? '').isNotEmpty)
          Image.network(
            imageUrl!,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => const _ImagePlaceholder(),
            loadingBuilder: (context, child, progress) {
              if (progress == null) return child;
              return const _ImagePlaceholder();
            },
          )
        else
          const _ImagePlaceholder(),
        if (isNew)
          PositionedDirectional(
            top: 10,
            start: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text(
                'NEW',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade100,
      alignment: Alignment.center,
      child: Icon(Icons.image_outlined, color: Colors.grey.shade400, size: 36),
    );
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({required this.status});

  final StockStatus status;

  @override
  Widget build(BuildContext context) {
    late final Color fg;
    late final Color bg;
    late final String label;

    switch (status) {
      case StockStatus.inStock:
        fg = Colors.green.shade800;
        bg = Colors.green.shade50;
        label = 'In stock';
        break;
      case StockStatus.lowStock:
        fg = Colors.orange.shade800;
        bg = Colors.orange.shade50;
        label = 'Low';
        break;
      case StockStatus.outOfStock:
        fg = Colors.red.shade800;
        bg = Colors.red.shade50;
        label = 'Out';
        break;
      case StockStatus.unknown:
        fg = Colors.grey.shade700;
        bg = Colors.grey.shade100;
        label = 'Stock';
        break;
    }

    final rtl = isArabicLocale(Localizations.localeOf(context));
    return Container(
      padding: EdgeInsetsDirectional.only(
        start: rtl ? 6 : 8,
        end: rtl ? 8 : 6,
        top: 4,
        bottom: 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}
