import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/orders_repository.dart';
import '../models/admin_order_model.dart';

final adminOrdersProvider = AsyncNotifierProvider<AdminOrdersNotifier, List<AdminOrder>>(
  AdminOrdersNotifier.new,
);

class AdminOrdersNotifier extends AsyncNotifier<List<AdminOrder>> {
  int _currentPage = 1;
  static const int _pageSize = 20;
  bool _hasMore = true;

  @override
  Future<List<AdminOrder>> build() async {
    _currentPage = 1;
    _hasMore = true;
    return _fetchOrders(page: _currentPage);
  }

  Future<List<AdminOrder>> _fetchOrders({required int page, bool forceRefresh = false}) async {
    final repository = ref.watch(ordersRepositoryProvider);
    
    final response = await repository.getOrders(
      page: page,
      pageSize: _pageSize,
      forceRefresh: forceRefresh,
    );

    if (response.length < _pageSize) {
      _hasMore = false;
    }

    return response.map((e) => AdminOrder.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    _currentPage = 1;
    _hasMore = true;
    state = await AsyncValue.guard(() => _fetchOrders(page: _currentPage, forceRefresh: true));
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading || state.isReloading) return;
    
    final currentOrders = state.asData?.value ?? [];
    _currentPage++;
    
    try {
      final newOrders = await _fetchOrders(page: _currentPage);
      state = AsyncData([...currentOrders, ...newOrders]);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    final currentList = state.asData?.value ?? [];
    if (currentList.isEmpty) return;

    final previousState = state;

    // Optimistic update
    state = AsyncData(currentList.map((order) {
      if (order.id == orderId) {
        return order.copyWith(status: newStatus);
      }
      return order;
    }).toList());

    try {
      final repository = ref.read(ordersRepositoryProvider);
      await repository.updateOrderStatus(orderId, newStatus.name);
    } catch (e) {
      // Revert optimism if failed
      state = previousState;
      rethrow;
    }
  }
}

