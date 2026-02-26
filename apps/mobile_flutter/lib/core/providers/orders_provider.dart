import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import '../utils/fetch_logger.dart';

final ordersControllerProvider = NotifierProvider<OrdersController, OrdersState>(
  OrdersController.new,
);

class OrdersState {
  const OrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.errorMessage,
  });

  final List<AppOrder> orders;
  final bool isLoading;
  final String? errorMessage;

  OrdersState copyWith({
    List<AppOrder>? orders,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class OrdersController extends Notifier<OrdersState> {
  SupabaseClient get _supabase => ref.read(supabaseClientProvider);

  @override
  OrdersState build() {
    _fetchOrders();
    return const OrdersState(isLoading: true);
  }

  Future<void> _fetchOrders() async {
    final session = ref.watch(sessionProvider);
    if (session == null) {
      state = const OrdersState(orders: []);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _supabase
          .from('orders')
          .select('''
            *,
            order_items (*)
          ''')
          .eq('user_id', session.user.id)
          .order('created_at', ascending: false)
          .executeAndLog('OrdersProvider:fetchOrders');

      final orders = response.map((row) {
        final itemsData = row['order_items'] as List? ?? [];
        final items = itemsData.map((itemRow) => AppOrderItem.fromJson(itemRow)).toList();
        return AppOrder.fromJson(row).copyWith(items: items);
      }).toList();

      state = state.copyWith(orders: orders, isLoading: false);
    } catch (e, st) {
      debugPrint('Error fetching orders: $e\n$st');
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load orders',
      );
    }
  }

  Future<void> refresh() async {
    await _fetchOrders();
  }
}
