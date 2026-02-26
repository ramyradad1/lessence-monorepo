import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  return NotificationsRepository(ref.read(supabaseClientProvider));
});

class NotificationsRepository extends BaseRepository {
  NotificationsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _notificationsCache = CacheManager(ttl: const Duration(minutes: 5));

  Future<List<Map<String, dynamic>>> getAdminNotifications({
    int page = 1,
    int pageSize = 20,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'notifications_page_${page}_size_$pageSize';
    final offset = (page - 1) * pageSize;

    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _notificationsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client
            .from('notifications')
            .select()
            .order('created_at', ascending: false)
            .range(offset, offset + pageSize - 1);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  Future<int> getUnreadCount() async {
    final response = await client.rpc('get_unread_notification_count');
    return (response as num).toInt();
  }

  Future<void> markAllRead() async {
    await client.rpc('mark_all_notifications_read');
    _notificationsCache.clear();
  }
}
