import 'package:flutter/material.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/models/app_models.dart';
import '../../../core/utils/egp_formatter.dart';

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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.black.withOpacity(0.04),
        border: Border.all(color: Colors.black.withOpacity(0.06)),
      ),
      child: Row(
        children: [
          Icon(leadingIcon),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.black54,
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

class InlineMessage extends StatelessWidget {
  const InlineMessage({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.withOpacity(0.25)),
      ),
      child: Text(text),
    );
  }
}

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

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 72,
                height: 72,
                color: Colors.black12,
                child: product.imageUrl == null || product.imageUrl!.isEmpty
                    ? const Icon(Icons.image_not_supported_outlined)
                    : Image.network(
                        product.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            const Icon(Icons.image_not_supported_outlined),
                      ),
              ),
            ),
            const SizedBox(width: 12),
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
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.black54,
                          ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    EgpFormatter.format(product.price, localeCode: localeCode),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  if (product.variants.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      product.variants.first.label(localeCode: localeCode),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.black54,
                          ),
                    ),
                  ] else if (product.sizeOptions.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      product.sizeOptions.first.size,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.black54,
                          ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              children: [
                IconButton(
                  tooltip: l10n.text('favorites'),
                  onPressed: onToggleFavorite,
                  icon: Icon(
                    isFavorite ? Icons.favorite : Icons.favorite_border,
                    color: isFavorite ? Colors.red : null,
                  ),
                ),
                FilledButton.tonal(
                  onPressed: onAddToCart,
                  child: Text(l10n.text('addToCart')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

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

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 56,
                    height: 56,
                    color: Colors.black12,
                    child: item.imageUrl == null || item.imageUrl!.isEmpty
                        ? const Icon(Icons.image_not_supported_outlined, size: 20)
                        : Image.network(
                            item.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const Icon(
                              Icons.image_not_supported_outlined,
                              size: 20,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.displayName(localeCode),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      if (optionLabel != null && optionLabel.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            optionLabel,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.black54,
                                ),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline),
                  tooltip: l10n.text('delete'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('${l10n.text('qty')}:'),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: onDecrease,
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.remove_circle_outline),
                ),
                Text('${item.quantity}'),
                IconButton(
                  onPressed: onIncrease,
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.add_circle_outline),
                ),
                const Spacer(),
                Text(
                  EgpFormatter.format(item.unitPrice * item.quantity, localeCode: localeCode),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
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
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black12),
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
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    color: Colors.black12,
                  ),
                  child: Text(
                    context.l10n.text('defaultAddress'),
                    style: theme.textTheme.labelSmall,
                  ),
                ),
              IconButton(
                onPressed: onEdit,
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.edit_outlined),
                tooltip: context.l10n.text('edit'),
              ),
              IconButton(
                onPressed: onDelete,
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.delete_outline),
                tooltip: context.l10n.text('delete'),
              ),
            ],
          ),
          const SizedBox(height: 4),
          for (final line in lines.where((line) => line.trim().isNotEmpty))
            Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                line,
                style: theme.textTheme.bodySmall?.copyWith(color: Colors.black87),
              ),
            ),
        ],
      ),
    );
  }
}
