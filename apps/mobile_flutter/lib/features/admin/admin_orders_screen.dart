import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../theme/app_colors.dart';
import 'widgets/admin_drawer.dart';
import 'models/admin_order_model.dart';
import 'providers/admin_orders_provider.dart';

class AdminOrdersScreen extends ConsumerStatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  ConsumerState<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends ConsumerState<AdminOrdersScreen> {
  final _currencyFormat = NumberFormat.currency(symbol: '\$');
  final _dateFormat = DateFormat('MMM dd, yyyy h:mm a');
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(adminOrdersProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(adminOrdersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Orders Management'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () {
              ref.read(adminOrdersProvider.notifier).refresh();
            },
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: ordersState.when(
        data: (orders) {
          if (orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.package,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No orders found',
                    style: TextStyle(
                      color: AppColors.foregroundMuted,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(adminOrdersProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: orders.length + (ordersState.isLoading ? 1 : 0),
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                if (index == orders.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  );
                }
                final order = orders[index];
                return _OrderCard(
                  order: order,
                  currencyFormat: _currencyFormat,
                  dateFormat: _dateFormat,
                  onStatusChanged: (newStatus) {
                    ref
                        .read(adminOrdersProvider.notifier)
                        .updateOrderStatus(order.id, newStatus);
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (err, st) => Center(
          child: Text(
            'Error loading orders:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.order,
    required this.currencyFormat,
    required this.dateFormat,
    required this.onStatusChanged,
  });

  final AdminOrder order;
  final NumberFormat currencyFormat;
  final DateFormat dateFormat;
  final ValueChanged<OrderStatus> onStatusChanged;

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Colors.orange;
      case OrderStatus.paid:
        return Colors.blue;
      case OrderStatus.processing:
        return Colors.purple;
      case OrderStatus.shipped:
        return Colors.teal;
      case OrderStatus.delivered:
        return Colors.green;
      case OrderStatus.cancelled:
      case OrderStatus.refunded:
        return AppColors.error;
    }
  }

  void _showOrderDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _OrderDetailsSheet(
        order: order,
        currencyFormat: currencyFormat,
        dateFormat: dateFormat,
        onStatusChanged: (status) {
          onStatusChanged(status);
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(order.status);
    
    return InkWell(
      onTap: () => _showOrderDetails(context),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppColors.surfaceCard,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '#${order.orderNumber.toUpperCase()}',
                  style: const TextStyle(
                    color: AppColors.foreground,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    order.status.displayName,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  LucideIcons.user,
                  size: 16,
                  color: AppColors.foregroundMuted,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    order.customerName ?? order.customerEmail ?? 'Guest User',
                    style: const TextStyle(
                      color: AppColors.foregroundMuted,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  currencyFormat.format(order.totalAmount),
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  LucideIcons.calendar,
                  size: 16,
                  color: AppColors.foregroundMuted,
                ),
                const SizedBox(width: 8),
                Text(
                  dateFormat.format(order.createdAt),
                  style: const TextStyle(
                    color: AppColors.foregroundMuted,
                    fontSize: 14,
                  ),
                ),
                const Spacer(),
                Text(
                  '${order.items.length} item(s)',
                  style: const TextStyle(
                    color: AppColors.foregroundMuted,
                    fontSize: 14,
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

class _OrderDetailsSheet extends StatelessWidget {
  const _OrderDetailsSheet({
    required this.order,
    required this.currencyFormat,
    required this.dateFormat,
    required this.onStatusChanged,
  });

  final AdminOrder order;
  final NumberFormat currencyFormat;
  final DateFormat dateFormat;
  final ValueChanged<OrderStatus> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSubtle,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 16),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Order #${order.orderNumber.toUpperCase()}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.foreground,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    DropdownButtonHideUnderline(
                      child: DropdownButton<OrderStatus>(
                        value: order.status,
                        dropdownColor: AppColors.surface,
                        icon: const Icon(LucideIcons.chevron_down, color: AppColors.primary),
                        items: OrderStatus.values.map((status) {
                          return DropdownMenuItem(
                            value: status,
                            child: Text(
                              status.displayName,
                              style: const TextStyle(color: AppColors.foreground),
                            ),
                          );
                        }).toList(),
                        onChanged: (newStatus) {
                          if (newStatus != null) {
                            onStatusChanged(newStatus);
                          }
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  dateFormat.format(order.createdAt),
                  style: const TextStyle(color: AppColors.foregroundMuted),
                ),
                
                const Divider(color: AppColors.border, height: 32),
                
                // Customer Info
                const Text(
                  'Customer Details',
                  style: TextStyle(
                    color: AppColors.foreground,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                _InfoRow(icon: LucideIcons.user, text: order.customerName ?? 'N/A'),
                const SizedBox(height: 8),
                _InfoRow(icon: LucideIcons.mail, text: order.customerEmail ?? 'N/A'),
                const SizedBox(height: 8),
                _InfoRow(
                  icon: LucideIcons.map_pin, 
                  text: order.shippingAddressId ?? 'No address provided',
                ),

                const Divider(color: AppColors.border, height: 32),

                // Order Items
                const Text(
                  'Order Items',
                  style: TextStyle(
                    color: AppColors.foreground,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                ...order.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLighter,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(LucideIcons.package, color: AppColors.foregroundMuted),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.productName,
                              style: const TextStyle(
                                color: AppColors.foreground,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (item.selectedSize != null)
                              Text(
                                'Size: ${item.selectedSize}',
                                style: const TextStyle(
                                  color: AppColors.foregroundMuted,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            currencyFormat.format(item.price),
                            style: const TextStyle(
                              color: AppColors.foreground,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'x${item.quantity}',
                            style: const TextStyle(
                              color: AppColors.foregroundMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                )),

                const Divider(color: AppColors.border, height: 32),
                
                // Summary
                _SummaryRow(title: 'Subtotal', value: currencyFormat.format(order.subtotal)),
                if (order.discountAmount > 0)
                  _SummaryRow(
                    title: 'Discount', 
                    value: '-${currencyFormat.format(order.discountAmount)}',
                    valueColor: AppColors.success,
                  ),
                const SizedBox(height: 8),
                _SummaryRow(
                  title: 'Total', 
                  value: currencyFormat.format(order.totalAmount),
                  isTotal: true,
                ),
                
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.foregroundMuted),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: AppColors.foregroundMuted),
          ),
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.title,
    required this.value,
    this.isTotal = false,
    this.valueColor,
  });

  final String title;
  final String value;
  final bool isTotal;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              color: isTotal ? AppColors.foreground : AppColors.foregroundMuted,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? (isTotal ? AppColors.primary : AppColors.foreground),
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 18 : 14,
            ),
          ),
        ],
      ),
    );
  }
}
