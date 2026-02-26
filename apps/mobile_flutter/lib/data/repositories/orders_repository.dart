import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(ref.read(supabaseClientProvider));
});

class OrdersRepository extends BaseRepository {
  OrdersRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _ordersCache = CacheManager(ttl: const Duration(minutes: 5));
  final CacheManager<Map<String, dynamic>> _singleOrderCache = CacheManager(ttl: const Duration(minutes: 5));

  Future<List<Map<String, dynamic>>> getOrders({
    int page = 1,
    int pageSize = 20,
    bool forceRefresh = false,
    String? status,
  }) async {
    final cacheKey = 'orders_page_${page}_size_${pageSize}_status_$status';
    final offset = (page - 1) * pageSize;

    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _ordersCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        var query = client
            .from('orders')
            .select('''
              *,
              order_items(*)
            ''');

        if (status != null && status.isNotEmpty) {
          query = query.eq('status', status) as dynamic;
        }

        final response = await query.order('created_at', ascending: false).range(offset, offset + pageSize - 1);
        return List<Map<String, dynamic>>.from(response as List);
      },
    );
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    await client.from('orders').update({'status': status}).eq('id', orderId);
    _ordersCache.clear();
    _singleOrderCache.remove('order_$orderId');
  }

  void invalidateCache() {
    _ordersCache.clear();
    _singleOrderCache.clear();
  }
}
