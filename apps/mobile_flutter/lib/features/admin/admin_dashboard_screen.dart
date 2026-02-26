import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../theme/app_colors.dart';
import 'providers/admin_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final dashboardAsync = ref.watch(adminDashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.text('admin_dashboard')),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.house),
            tooltip: 'Back to Home',
            onPressed: () => context.go('/'),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: dashboardAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Error loading dashboard:\n$err',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
        ),
        data: (stats) {
          return RefreshIndicator(
            onRefresh: () => ref.refresh(adminDashboardProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Text(
                  'Overview',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.9,
                  children: [
                    _MetricCard(
                      title: 'Total Revenue',
                      value: '${stats['totalRevenue']} EGP',
                      icon: LucideIcons.dollar_sign,
                    ),
                    _MetricCard(
                      title: 'Total Orders',
                      value: '${stats['totalOrders']}',
                      icon: LucideIcons.shopping_bag,
                    ),
                    _MetricCard(
                      title: 'Total Users',
                      value: '${stats['totalUsers']}',
                      icon: LucideIcons.users,
                    ),
                    _MetricCard(
                      title: 'Total Products',
                      value: '${stats['totalProducts']}',
                      icon: LucideIcons.package,
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.primary, size: 28),
          const SizedBox(height: 12),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.foregroundMuted,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

