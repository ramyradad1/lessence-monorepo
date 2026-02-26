import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_colors.dart';

class AdminDrawer extends StatelessWidget {
  const AdminDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final currentPath = GoRouterState.of(context).uri.path;

    return Drawer(
      backgroundColor: AppColors.backgroundSubtle,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(24)),
      ),
      elevation: 16,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'L\'ESSENCE',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: AppColors.foreground,
                          letterSpacing: 2,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Admin Panel',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Divider(color: AppColors.border),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  _DrawerItem(
                    title: 'Dashboard',
                    icon: LucideIcons.layout_dashboard,
                    activeIcon: LucideIcons.layout_dashboard,
                    isSelected: currentPath == '/admin',
                    onTap: () {
                      Navigator.pop(context); // Close drawer
                      if (currentPath != '/admin') context.go('/admin');
                    },
                  ),
                  const _DrawerSectionTitle(title: 'Overview'),
                  _DrawerItem(
                    title: 'Orders',
                    icon: LucideIcons.package,
                    activeIcon: LucideIcons.package,
                    isSelected: currentPath == '/admin/orders',
                    onTap: () => _handleNav(context, currentPath, '/admin/orders'),
                  ),
                  _DrawerItem(
                    title: 'Products',
                    icon: LucideIcons.shopping_bag,
                    activeIcon: LucideIcons.shopping_bag,
                    isSelected: currentPath == '/admin/products',
                    onTap: () => _handleNav(context, currentPath, '/admin/products'),
                  ),
                  const _DrawerSectionTitle(title: 'Organize'),
                  _DrawerItem(
                    title: 'Categories',
                    icon: LucideIcons.layout_grid,
                    activeIcon: LucideIcons.layout_grid,
                    isSelected: currentPath == '/admin/categories',
                    onTap: () => _handleNav(context, currentPath, '/admin/categories'),
                  ),
                  _DrawerItem(
                    title: 'Brands',
                    icon: LucideIcons.stamp,
                    activeIcon: LucideIcons.stamp,
                    isSelected: currentPath == '/admin/brands',
                    onTap: () => _handleNav(context, currentPath, '/admin/brands'),
                  ),
                  _DrawerItem(
                    title: 'Collections',
                    icon: LucideIcons.bookmark,
                    activeIcon: LucideIcons.bookmark,
                    isSelected: currentPath == '/admin/collections',
                    onTap: () => _handleNav(context, currentPath, '/admin/collections'),
                  ),
                  _DrawerItem(
                    title: 'Gift Sets',
                    icon: LucideIcons.gift,
                    activeIcon: LucideIcons.gift,
                    isSelected: currentPath == '/admin/bundles',
                    onTap: () => _handleNav(context, currentPath, '/admin/bundles'),
                  ),
                  const _DrawerSectionTitle(title: 'Engagement'),
                  _DrawerItem(
                    title: 'Reports',
                    icon: LucideIcons.chart_pie,
                    activeIcon: LucideIcons.chart_pie,
                    isSelected: currentPath == '/admin/reports',
                    onTap: () => _handleNav(context, currentPath, '/admin/reports'),
                  ),
                  _DrawerItem(
                    title: 'Coupons',
                    icon: LucideIcons.tag,
                    activeIcon: LucideIcons.tag,
                    isSelected: currentPath == '/admin/coupons',
                    onTap: () => _handleNav(context, currentPath, '/admin/coupons'),
                  ),
                  _DrawerItem(
                    title: 'Reviews',
                    icon: LucideIcons.star,
                    activeIcon: LucideIcons.star,
                    isSelected: currentPath == '/admin/reviews',
                    onTap: () => _handleNav(context, currentPath, '/admin/reviews'),
                  ),
                  const _DrawerSectionTitle(title: 'People'),
                  _DrawerItem(
                    title: 'Customers',
                    icon: LucideIcons.user,
                    activeIcon: LucideIcons.user,
                    isSelected: currentPath == '/admin/customers',
                    onTap: () => _handleNav(context, currentPath, '/admin/customers'),
                  ),
                  _DrawerItem(
                    title: 'Users',
                    icon: LucideIcons.user_cog,
                    activeIcon: LucideIcons.user_cog,
                    isSelected: currentPath == '/admin/users',
                    onTap: () => _handleNav(context, currentPath, '/admin/users'),
                  ),
                  const _DrawerSectionTitle(title: 'Configuration'),
                  _DrawerItem(
                    title: 'Settings',
                    icon: LucideIcons.settings,
                    activeIcon: LucideIcons.settings,
                    isSelected: currentPath == '/admin/settings',
                    onTap: () => _handleNav(context, currentPath, '/admin/settings'),
                  ),
                  _DrawerItem(
                    title: 'Policies',
                    icon: LucideIcons.shield_check,
                    activeIcon: LucideIcons.shield_check,
                    isSelected: currentPath == '/admin/policies',
                    onTap: () => _handleNav(context, currentPath, '/admin/policies'),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Divider(color: AppColors.border),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: _DrawerItem(
                title: 'Back to Home',
                icon: LucideIcons.house,
                activeIcon: LucideIcons.house,
                isSelected: false,
                onTap: () {
                  Navigator.pop(context);
                  context.go('/');
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleNav(BuildContext context, String currentPath, String targetPath) {
    Navigator.pop(context); // Close drawer
    if (currentPath != targetPath) context.go(targetPath);
  }
}

class _DrawerSectionTitle extends StatelessWidget {
  const _DrawerSectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 16, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.foregroundFaint,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.title,
    required this.icon,
    required this.activeIcon,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final IconData activeIcon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? AppColors.primary : AppColors.foregroundMuted;
    final bgColor = isSelected ? AppColors.primary.withAlpha(20) : Colors.transparent;
    final fontWeight = isSelected ? FontWeight.bold : FontWeight.w600;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          hoverColor: AppColors.surfaceLighter.withAlpha(50),
          highlightColor: AppColors.primary.withAlpha(10),
          splashColor: AppColors.primary.withAlpha(20),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppColors.primary.withAlpha(50) : Colors.transparent,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected ? activeIcon : icon,
                  color: color,
                  size: 22,
                ),
                const SizedBox(width: 16),
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isSelected ? AppColors.foreground : AppColors.foregroundMuted,
                        fontWeight: fontWeight,
                      ),
                ),
                if (isSelected) const Spacer(),
                if (isSelected)
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
