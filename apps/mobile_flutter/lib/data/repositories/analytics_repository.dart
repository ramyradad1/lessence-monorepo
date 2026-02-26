import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final analyticsRepositoryProvider = Provider<AnalyticsRepository>((ref) {
  return AnalyticsRepository(ref.read(supabaseClientProvider));
});

class AnalyticsRepository extends BaseRepository {
  AnalyticsRepository(super.client);

  final CacheManager<Map<String, dynamic>> _dashboardCache = CacheManager(ttl: const Duration(minutes: 5));

  /// Gets the aggregated dashboard metrics using the backend RPC
  Future<Map<String, dynamic>> getDashboardMetrics({bool forceRefresh = false}) async {
    const cacheKey = 'admin_dashboard_metrics';
    
    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _dashboardCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.rpc('get_admin_dashboard_metrics');
        // response is an array of 1 object due to Supabase RPC structure usually, 
        // or a direct JSON if single row. Handling assuming JSON object return.
        
        // Sometimes wrapped in list, so we standardize:
        if (response is List && response.isNotEmpty) {
           return response.first as Map<String, dynamic>;
        }
        return response as Map<String, dynamic>;
      },
    );
  }

  Future<List<Map<String, dynamic>>> getTopProducts({int limit = 5, bool forceRefresh = false, String? startDate, String? endDate}) async {
    // Basic cache key
    return fetchWithCache(
      cacheKey: 'top_products_$limit',
      cache: CacheManager<List<Map<String, dynamic>>>(ttl: const Duration(minutes: 15)),
      forceRefresh: forceRefresh,
      fetcher: () async {
        final Map<String, dynamic> params = {'limit_count': limit};
        if (startDate != null) params['start_date'] = startDate;
        if (endDate != null) params['end_date'] = endDate;
        // Setting default dates if missing just in case the RPC requires them
        params['start_date'] ??= DateTime.now().subtract(const Duration(days: 30)).toIso8601String();
        params['end_date'] ??= DateTime.now().toIso8601String();

        final response = await client.rpc('get_best_selling_products', params: params);
        return List<Map<String, dynamic>>.from(response);
      }
    );
  }

  Future<Map<String, dynamic>> getDetailedMetrics({String period = '30d', bool forceRefresh = false}) async {
    return fetchWithCache(
      cacheKey: 'admin_dashboard_metrics_v2_$period',
      cache: CacheManager<Map<String, dynamic>>(ttl: const Duration(minutes: 5)),
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.rpc('get_admin_dashboard_metrics_v2', params: {'p_period': period});
        return response as Map<String, dynamic>;
      },
    );
  }
}
