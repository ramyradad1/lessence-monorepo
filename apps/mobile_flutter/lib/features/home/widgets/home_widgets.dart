import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/models/app_models.dart';
import '../../../core/utils/egp_formatter.dart';
import '../../../theme/app_colors.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

// ── Status Banner ──────────────────────────────────────────────────
class StatusBanner extends StatelessWidget {
  const StatusBanner({
    super.key,
    required this.leadingIcon,
    required this.title,
    required this.subtitle,
  });

  final IconData leadingIcon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppColors.primaryMuted,
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(leadingIcon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                    color: AppColors.foreground,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.foregroundMuted,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Inline Message ─────────────────────────────────────────────────
class InlineMessage extends StatelessWidget {
  const InlineMessage({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.warningBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.info, size: 18, color: AppColors.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: AppColors.warning,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Product Card Tile (for Favorites / lists) ──────────────────────
class ProductCardTile extends StatelessWidget {
  const ProductCardTile({
    super.key,
    required this.product,
    required this.localeCode,
    required this.isFavorite,
    required this.onToggleFavorite,
    required this.onAddToCart,
  });

  final AppProduct product;
  final String localeCode;
  final bool isFavorite;
  final VoidCallback onToggleFavorite;
  final VoidCallback onAddToCart;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final subtitle = product.displaySubtitle(localeCode);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: AppColors.surfaceCard,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image ──────────────────────────────────
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 76,
                height: 76,
                color: AppColors.backgroundSubtle,
                child: product.imageUrl == null || product.imageUrl!.isEmpty
                    ? Icon(
                        LucideIcons.image,
                        color: AppColors.foregroundFaint,
                      )
                    : CachedNetworkImage(
                        imageUrl: product.imageUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => Icon(
                          LucideIcons.image_off,
                          color: AppColors.foregroundFaint,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 14),

            // ── Info ───────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.displayName(localeCode),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  if (subtitle != null && subtitle.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.foregroundMuted,
                          ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    EgpFormatter.format(product.price, localeCode: localeCode),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                        ),
                  ),
                  if (product.variants.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      product.variants.first.label(localeCode: localeCode),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.foregroundFaint,
                          ),
                    ),
                  ] else if (product.sizeOptions.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      product.sizeOptions.first.size,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.foregroundFaint,
                          ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),

            // ── Actions ────────────────────────────────
            Column(
              children: [
                IconButton(
                  tooltip: l10n.text('favorites'),
                  onPressed: onToggleFavorite,
                  icon: Icon(
                    isFavorite
                        ? LucideIcons.heart
                        : LucideIcons.heart,
                    color: isFavorite
                        ? AppColors.error
                        : AppColors.foregroundFaint,
                  ),
                ),
                SizedBox(
                  height: 34,
                  child: FilledButton(
                    onPressed: onAddToCart,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      textStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    child: Text(l10n.text('addToCart')),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Cart Item Card ─────────────────────────────────────────────────
class CartItemCard extends StatelessWidget {
  const CartItemCard({
    super.key,
    required this.item,
    required this.localeCode,
    required this.onDecrease,
    required this.onIncrease,
    required this.onRemove,
  });

  final CartItemModel item;
  final String localeCode;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final optionLabel = item.variantLabel ?? item.selectedSize;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: AppColors.surfaceCard,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Image ────────────────────────────
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 60,
                    height: 60,
                    color: AppColors.backgroundSubtle,
                    child: item.imageUrl == null || item.imageUrl!.isEmpty
                        ? Icon(
                            LucideIcons.image,
                            size: 20,
                            color: AppColors.foregroundFaint,
                          )
                        : CachedNetworkImage(
                            imageUrl: item.imageUrl!,
                            fit: BoxFit.cover,
                            errorWidget: (context, url, error) => Icon(
                              LucideIcons.image_off,
                              size: 20,
                              color: AppColors.foregroundFaint,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 14),

                // ── Info ──────────────────────────────
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.displayName(localeCode),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      if (optionLabel != null && optionLabel.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: Text(
                            optionLabel,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: AppColors.foregroundMuted),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onRemove,
                  icon: Icon(
                    LucideIcons.trash_2,
                    color: AppColors.error.withValues(alpha: 0.7),
                  ),
                  tooltip: l10n.text('delete'),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // ── Quantity + Price ──────────────────────
            Row(
              children: [
                Text(
                  '${l10n.text('qty')}:',
                  style: TextStyle(color: AppColors.foregroundMuted),
                ),
                const SizedBox(width: 8),
                _QuantityButton(
                  icon: LucideIcons.minus,
                  onPressed: onDecrease,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    '${item.quantity}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
                _QuantityButton(icon: LucideIcons.plus,
                  onPressed: onIncrease,
                ),
                const Spacer(),
                Text(
                  EgpFormatter.format(
                    item.unitPrice * item.quantity,
                    localeCode: localeCode,
                  ),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppColors.primaryMuted,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: IconButton(
        onPressed: onPressed,
        padding: EdgeInsets.zero,
        iconSize: 16,
        icon: Icon(icon, color: AppColors.primary),
      ),
    );
  }
}

// ── Address Card Tile ──────────────────────────────────────────────
class AddressCardTile extends StatelessWidget {
  const AddressCardTile({
    super.key,
    required this.address,
    required this.onEdit,
    required this.onDelete,
  });

  final AddressModel address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lines = <String>[
      address.addressLine1,
      if ((address.addressLine2 ?? '').trim().isNotEmpty) address.addressLine2!,
      [
        address.city,
        address.state,
        address.postalCode,
      ].where((e) => e.trim().isNotEmpty).join(', '),
      address.country,
      if ((address.phone ?? '').trim().isNotEmpty) address.phone!,
    ];

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  address.fullName,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (address.isDefault)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    gradient: AppColors.primaryGradient,
                  ),
                  child: Text(
                    context.l10n.text('defaultAddress'),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              IconButton(
                onPressed: onEdit,
                visualDensity: VisualDensity.compact,
                icon: const Icon(LucideIcons.pencil, size: 18),
                color: AppColors.primary,
                tooltip: context.l10n.text('edit'),
              ),
              IconButton(
                onPressed: onDelete,
                visualDensity: VisualDensity.compact,
                icon: const Icon(LucideIcons.trash_2, size: 18),
                color: AppColors.error.withValues(alpha: 0.7),
                tooltip: context.l10n.text('delete'),
              ),
            ],
          ),
          const SizedBox(height: 6),
          for (final line in lines.where((line) => line.trim().isNotEmpty))
            Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                line,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.foregroundMuted,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
