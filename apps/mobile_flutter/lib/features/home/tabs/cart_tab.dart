import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/utils/egp_formatter.dart';
import '../../../theme/app_colors.dart';
import '../widgets/home_widgets.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

class CartTab extends ConsumerWidget {
  const CartTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final localeCode = Localizations.localeOf(context).languageCode;
    final cartState = ref.watch(cartControllerProvider);
    final cartController = ref.read(cartControllerProvider.notifier);

    return Column(
      children: [
        if (cartState.errorMessage != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
            child: InlineMessage(text: cartState.errorMessage!),
          ),
        Expanded(
          child: RefreshIndicator(
            color: AppColors.primary,
            onRefresh: cartController.refresh,
            child: cartState.items.isEmpty
                ? ListView(
                    padding: const EdgeInsets.only(
                      left: 24,
                      top: 24,
                      right: 24,
                      bottom: 120,
                    ),
                    children: [
                      const SizedBox(height: 60),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.primaryMuted,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.shopping_bag,
                          size: 48,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        l10n.text('cartEmpty'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: AppColors.foregroundMuted),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.only(
                      left: 14,
                      top: 14,
                      right: 14,
                      bottom: 120,
                    ),
                    children: [
                      StatusBanner(
                        leadingIcon: LucideIcons.shopping_bag,
                        title: l10n.text('cart'),
                        subtitle:
                            '${cartState.itemCount} • ${l10n.text('total')}: ${EgpFormatter.format(cartState.totalAmount, localeCode: localeCode)}',
                      ),
                      const SizedBox(height: 10),
                      for (final item in cartState.items)
                        CartItemCard(
                          item: item,
                          localeCode: localeCode,
                          onDecrease: () => cartController.updateQuantity(
                            item.key,
                            item.quantity - 1,
                          ),
                          onIncrease: () => cartController.updateQuantity(
                            item.key,
                            item.quantity + 1,
                          ),
                          onRemove: () => cartController.removeItem(item.key),
                        ),
                      const SizedBox(height: 80),
                    ],
                  ),
          ),
        ),

        // ── Bottom Checkout Bar ──────────────────────────
        if (cartState.items.isNotEmpty)
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 100),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 8,
                    offset: Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          l10n.text('total'),
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(color: AppColors.foregroundMuted),
                        ),
                        Text(
                          EgpFormatter.format(
                            cartState.totalAmount,
                            localeCode: localeCode,
                          ),
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: cartState.isSyncing
                        ? null
                        : cartController.clearCart,
                    child: Text(l10n.text('clearCart')),
                  ),
                  const SizedBox(width: 8),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.35),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () {
                        if (!cartState.isSyncing) {
                          context.push('/checkout');
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                      ),
                      child: Text(l10n.text('checkout')),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
