import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/utils/egp_formatter.dart';
import '../../../core/utils/locale_utils.dart';
import '../../../theme/app_colors.dart';
import '../models/catalog_models.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

/// Premium product card used in horizontal carousels and grid layouts.
class CatalogProductCard extends StatefulWidget {
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
  State<CatalogProductCard> createState() => _CatalogProductCardState();
}

class _CatalogProductCardState extends State<CatalogProductCard> {
  bool _isPressed = false;

  void _handleTapDown(TapDownDetails details) =>
      setState(() => _isPressed = true);
  void _handleTapUp(TapUpDetails details) => setState(() => _isPressed = false);
  void _handleTapCancel() => setState(() => _isPressed = false);

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final title = widget.product.localizedName(locale);
    final subtitle = widget.product.localizedSubtitle(locale);
    final gallery = widget.product.galleryUrls;
    final image = gallery.isNotEmpty ? gallery.first : widget.product.imageUrl;
    final priceLabel = EgpFormatter.format(
      widget.product.minAvailablePrice,
      localeCode: locale.toLanguageTag(),
    );

    return SizedBox(
      width: widget.width,
      child: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _isPressed ? 0.96 : 1.0,
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeOutCubic,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderHover),
              boxShadow: AppColors.shadowMd,
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // ── Edge-to-edge Image ──────────────────────────
                _ProductImage(imageUrl: image, isNew: widget.product.isNew),

                // ── Bottom Glass Panel ──────────────────────────
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: ClipRRect(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                        decoration: AppColors.glassPanelEffect,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Title
                            Text(
                              title.isEmpty ? 'Unnamed product' : title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.foreground,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                height: 1.2,
                                shadows:
                                    AppColors.shadowSm, // Subtle text shadow
                              ),
                            ),
                            const SizedBox(height: 2),
                            // Subtitle / Category
                            if (subtitle.isNotEmpty)
                              Text(
                                subtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.foregroundMuted,
                                  fontSize: 12,
                                  height: 1.2,
                                ),
                              )
                            else if (widget.showCategory &&
                                (widget.product.categoryName ?? '').isNotEmpty)
                              Text(
                                widget.product.categoryName!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.foregroundFaint,
                                  fontSize: 12,
                                  height: 1.2,
                                ),
                              ),
                            const SizedBox(height: 6),
                            // Price + Stock
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    priceLabel,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                      height: 1.2,
                                    ),
                                  ),
                                ),
                                _StockDot(
                                  status: widget.product.overallStockStatus,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Product Image with Glass Badge ──────────────────────────────────
class _ProductImage extends StatelessWidget {
  const _ProductImage({required this.imageUrl, required this.isNew});

  final String? imageUrl;
  final bool isNew;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(color: AppColors.backgroundSubtle),
        if ((imageUrl ?? '').isNotEmpty)
          CachedNetworkImage(
            imageUrl: imageUrl!,
            fit: BoxFit.cover,
            errorWidget: (context, url, error) => const _ImagePlaceholder(),
            placeholder: (context, url) => const _ShimmerPlaceholder(),
          )
        else
          const _ImagePlaceholder(),
        if (isNew)
          PositionedDirectional(
            top: 10,
            start: 10,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.5),
                      width: 0.5,
                    ),
                  ),
                  child: const Text(
                    'NEW',
                    style: TextStyle(
                      color: AppColors.primaryLight,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.0,
                    ),
                  ),
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
      color: AppColors.backgroundSubtle,
      alignment: Alignment.center,
      child: Icon(
        LucideIcons.image,
        color: AppColors.foregroundFaint,
        size: 36,
      ),
    );
  }
}

class _ShimmerPlaceholder extends StatelessWidget {
  const _ShimmerPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.surfaceMuted,
            AppColors.primaryMuted,
            AppColors.surfaceMuted,
          ],
        ),
      ),
    );
  }
}

/// Compact colored dot for stock status – avoids text overflow.
class _StockDot extends StatelessWidget {
  const _StockDot({required this.status});

  final StockStatus status;

  @override
  Widget build(BuildContext context) {
    late final Color dotColor;
    late final String tooltip;

    switch (status) {
      case StockStatus.inStock:
        dotColor = AppColors.success;
        tooltip = 'In stock';
        break;
      case StockStatus.lowStock:
        dotColor = AppColors.warning;
        tooltip = 'Low stock';
        break;
      case StockStatus.outOfStock:
        dotColor = AppColors.error;
        tooltip = 'Out of stock';
        break;
      case StockStatus.unknown:
        dotColor = AppColors.foregroundFaint;
        tooltip = 'Stock unknown';
        break;
    }

    final rtl = isArabicLocale(Localizations.localeOf(context));
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 8,
        height: 8,
        margin: EdgeInsetsDirectional.only(
          start: rtl ? 0 : 6,
          end: rtl ? 6 : 0,
        ),
        decoration: BoxDecoration(
          color: dotColor,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: dotColor.withValues(alpha: 0.4), blurRadius: 4),
          ],
        ),
      ),
    );
  }
}
