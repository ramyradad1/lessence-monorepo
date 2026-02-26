import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/providers/favorites_provider.dart';
import '../../../theme/app_colors.dart';
import '../widgets/home_widgets.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

class FavoritesTab extends ConsumerWidget {
  const FavoritesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final localeCode = Localizations.localeOf(context).languageCode;
    final favoritesState = ref.watch(favoritesControllerProvider);
    final favoriteProductsAsync = ref.watch(favoriteProductsProvider);

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => ref.read(favoritesControllerProvider.notifier).refresh(),
      child: favoriteProductsAsync.when(
        data: (products) {
          if (favoritesState.ids.isEmpty) {
            return ListView(
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
                    LucideIcons.heart,
                    size: 48,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  l10n.text('favoritesEmpty'),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.foregroundMuted,
                  ),
                ),
              ],
            );
          }

          return ListView(
            padding: const EdgeInsets.only(
              left: 14,
              top: 14,
              right: 14,
              bottom: 120,
            ),
            children: [
              StatusBanner(
                leadingIcon: LucideIcons.heart,
                title: l10n.text('favorites'),
                subtitle: '${favoritesState.ids.length}',
              ),
              const SizedBox(height: 10),
              if (favoritesState.errorMessage != null) ...[
                InlineMessage(text: favoritesState.errorMessage!),
                const SizedBox(height: 10),
              ],
              for (final product in products)
                ProductCardTile(
                  product: product,
                  localeCode: localeCode,
                  isFavorite: true,
                  onToggleFavorite: () => ref
                      .read(favoritesControllerProvider.notifier)
                      .toggleFavorite(product.id),
                  onAddToCart: () => ref
                      .read(cartControllerProvider.notifier)
                      .addProduct(product),
                ),
            ],
          );
        },
        loading: () => ListView(
          padding: const EdgeInsets.only(
            left: 24,
            top: 24,
            right: 24,
            bottom: 120,
          ),
          children: [
            const SizedBox(height: 80),
            const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Center(
              child: Text(
                l10n.text('loading'),
                style: TextStyle(color: AppColors.foregroundMuted),
              ),
            ),
          ],
        ),
        error: (error, _) => ListView(
          padding: const EdgeInsets.only(
            left: 24,
            top: 24,
            right: 24,
            bottom: 120,
          ),
          children: [
            const SizedBox(height: 60),
            Icon(
              LucideIcons.circle_alert,
              size: 48,
              color: AppColors.warning,
            ),
            const SizedBox(height: 16),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.foregroundMuted),
            ),
            const SizedBox(height: 16),
            Center(
              child: FilledButton(
                onPressed: () => ref.invalidate(favoriteProductsProvider),
                child: Text(l10n.text('refresh')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
