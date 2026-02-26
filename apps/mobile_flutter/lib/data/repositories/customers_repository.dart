import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final customersRepositoryProvider = Provider<CustomersRepository>((ref) {
  return CustomersRepository(ref.read(supabaseClientProvider));
});

class CustomersRepository extends BaseRepository {
  CustomersRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _customersCache = CacheManager(ttl: const Duration(minutes: 15));

  Future<List<Map<String, dynamic>>> getCustomers({
    int page = 1,
    int pageSize = 20,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'customers_page_${page}_size_$pageSize';
    final offset = (page - 1) * pageSize;

    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _customersCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        // Typically a customer list joins profiles and basic aggregates. 
        // For now, selecting profiles representing customers.
        final response = await client
            .from('profiles')
            .select()
            .order('created_at', ascending: false)
            .range(offset, offset + pageSize - 1);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }
}
