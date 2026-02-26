import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';


import '../../../core/localization/app_localizations.dart';
import '../../../theme/app_colors.dart';
import 'providers/admin_reports_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminReportsScreen extends ConsumerWidget {
  const AdminReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final reportsAsync = ref.watch(currentAdminReportsProvider);
    final selectedPeriod = ref.watch(selectedReportPeriodProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.text('reports')),
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
      body: Column(
        children: [
          // Period Selector Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Time Period',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                DropdownButton<String>(
                  value: selectedPeriod,
                  underline: const SizedBox(),
                  dropdownColor: AppColors.surfaceCard.color,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  items: const [
                    DropdownMenuItem(value: '7d', child: Text('Last 7 Days')),
                    DropdownMenuItem(value: '30d', child: Text('Last 30 Days')),
                    DropdownMenuItem(value: '90d', child: Text('Last 90 Days')),
                    DropdownMenuItem(value: '1y', child: Text('Last Year')),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      ref.read(selectedReportPeriodProvider.notifier).setPeriod(val);
                    }
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          
          Expanded(
            child: reportsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    'Error loading reports:\n$err',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.redAccent),
                  ),
                ),
              ),
              data: (data) => _buildReportContent(context, ref, data),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportContent(BuildContext context, WidgetRef ref, Map<String, dynamic> data) {
    final topProducts = data['topProducts'] as List? ?? [];
    
    return RefreshIndicator(
      onRefresh: () async {
        final period = ref.read(selectedReportPeriodProvider);
        return ref.refresh(adminReportsProvider(period).future);
      },
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // KPIs
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 0.85,
            children: [
              _MetricCard(
                title: 'Revenue',
                value: '${data['totalRevenue'] ?? 0} EGP',
                icon: LucideIcons.dollar_sign,
                trend: _parseDouble(data['revenueTrend']),
              ),
              _MetricCard(
                title: 'Orders',
                value: '${data['orderCount'] ?? 0}',
                icon: LucideIcons.shopping_bag,
                trend: _parseDouble(data['orderTrend']),
              ),
              _MetricCard(
                title: 'Customers',
                value: '${data['uniqueCustomers'] ?? 0}',
                icon: LucideIcons.users,
                trend: _parseDouble(data['customerTrend']),
              ),
              _MetricCard(
                title: 'Visitors',
                value: '${data['visitorCount'] ?? 0}',
                icon: LucideIcons.eye,
                trend: _parseDouble(data['visitorTrend']),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Top Products Section
          Text(
            'Top Selling Products',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
          ),
          const SizedBox(height: 16),
          
          if (topProducts.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text(
                  'No sales data for this period.',
                  style: TextStyle(color: AppColors.foregroundMuted),
                ),
              ),
            )
          else
            ...topProducts.map((product) => _TopProductTile(product: product as Map<String, dynamic>)),
            
          const SizedBox(height: 40), // Bottom padding
        ],
      ),
    );
  }
  
  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.trend,
  });

  final String title;
  final String value;
  final IconData icon;
  final double trend;

  @override
  Widget build(BuildContext context) {
    final isPositive = trend >= 0;
    final trendColor = isPositive ? Colors.greenAccent : Colors.redAccent;
    final trendIcon = isPositive ? LucideIcons.arrow_up : LucideIcons.arrow_down;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: AppColors.primary, size: 28),
              if (trend != 0)
                Row(
                  children: [
                    Icon(trendIcon, color: trendColor, size: 14),
                    const SizedBox(width: 2),
                    Text(
                      '${trend.abs()}%',
                      style: TextStyle(color: trendColor, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
            ],
          ),
          const Spacer(),
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
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
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

class _TopProductTile extends StatelessWidget {
  const _TopProductTile({required this.product});
  
  final Map<String, dynamic> product;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppColors.surfaceCard,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.2),
          child: const Icon(LucideIcons.package, color: AppColors.primary),
        ),
        title: Text(
          product['name'] ?? 'Unknown',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${product['quantity'] ?? 0} units sold',
          style: TextStyle(color: AppColors.foregroundMuted),
        ),
        trailing: Text(
          '${product['revenue'] ?? 0} EGP',
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}


