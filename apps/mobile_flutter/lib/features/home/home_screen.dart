import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/widgets/language_menu_button.dart';
import 'tabs/cart_tab.dart';
import 'tabs/favorites_tab.dart';
import 'tabs/profile_tab.dart';
import 'tabs/shop_tab.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.brandName),
          actions: [
            const LanguageMenuButton(),
            IconButton(
              tooltip: l10n.text('signOut'),
              onPressed: () => ref.read(authNotifierProvider).signOut(),
              icon: const Icon(Icons.logout),
            ),
          ],
          bottom: TabBar(
            isScrollable: true,
            tabs: [
              Tab(
                text: l10n.text('shopTab'),
                icon: const Icon(Icons.storefront_outlined),
              ),
              Tab(
                text: l10n.text('favoritesTab'),
                icon: const Icon(Icons.favorite_border),
              ),
              Tab(
                text: l10n.text('cartTab'),
                icon: const Icon(Icons.shopping_bag_outlined),
              ),
              Tab(
                text: l10n.text('profileTab'),
                icon: const Icon(Icons.person_outline),
              ),
            ],
          ),
        ),
        body: const TabBarView(
          children: [ShopTab(), FavoritesTab(), CartTab(), ProfileTab()],
        ),
      ),
    );
  }
}
