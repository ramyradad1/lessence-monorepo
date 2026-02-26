import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/storage/sync_service.dart';
import '../../core/widgets/language_menu_button.dart';
import '../../theme/app_colors.dart';
import 'tabs/cart_tab.dart';
import 'tabs/favorites_tab.dart';
import 'tabs/profile_tab.dart';
import 'tabs/shop_tab.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _currentIndex = 0;

  static const _tabs = [ShopTab(), FavoritesTab(), CartTab(), ProfileTab()];

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isOnline = ref.watch(isOnlineProvider);

    return Scaffold(
      extendBody: true,
      appBar: AppBar(
        centerTitle: false,
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Text(
            l10n.brandName,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ),
        actions: [
          const LanguageMenuButton(),
          IconButton(
            tooltip: l10n.text('signOut'),
            onPressed: () => ref.read(authNotifierProvider).signOut(),
            icon: const Icon(LucideIcons.log_out),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // ── Offline banner ───────────────────────────
          if (!isOnline)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFFFF8E1), Color(0xFFFFECB3)],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.wifi_off,
                    size: 14,
                    color: Colors.amber.shade900,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Offline mode',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.amber.shade900,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          // ── Tab body ─────────────────────────────────
          Expanded(
            child: IndexedStack(index: _currentIndex, children: _tabs),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.only(left: 24, right: 24, bottom: 24),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
              child: Container(
                decoration: AppColors.glassDockEffect,
                child: BottomNavigationBar(
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  type: BottomNavigationBarType.fixed,
                  selectedItemColor: AppColors.primary,
                  unselectedItemColor: AppColors.foregroundFaint,
                  showSelectedLabels: true,
                  showUnselectedLabels: false,
                  selectedLabelStyle: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  currentIndex: _currentIndex,
                  onTap: (index) => setState(() => _currentIndex = index),
                  items: [
                    BottomNavigationBarItem(
                      icon: const Icon(LucideIcons.store),
                      activeIcon: const Icon(LucideIcons.store),
                      label: l10n.text('shopTab'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(LucideIcons.heart),
                      activeIcon: const Icon(LucideIcons.heart),
                      label: l10n.text('favoritesTab'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(LucideIcons.shopping_bag),
                      activeIcon: const Icon(LucideIcons.shopping_bag),
                      label: l10n.text('cartTab'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(LucideIcons.user),
                      activeIcon: const Icon(LucideIcons.user),
                      label: l10n.text('profileTab'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
