import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final couponsRepositoryProvider = Provider<CouponsRepository>((ref) {
  return CouponsRepository(ref.read(supabaseClientProvider));
});

class CouponsRepository extends BaseRepository {
  CouponsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _couponsCache = CacheManager(ttl: const Duration(minutes: 15));

  Future<List<Map<String, dynamic>>> getCoupons({bool forceRefresh = false}) async {
    const cacheKey = 'admin_coupons';
    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _couponsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.from('coupons').select().order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  Future<void> saveCoupon(Map<String, dynamic> data) async {
    if (data['id'] != null) {
      await client.from('coupons').update(data).eq('id', data['id']);
    } else {
      await client.from('coupons').insert(data);
    }
    _couponsCache.clear();
  }

  Future<void> deleteCoupon(String id) async {
    await client.from('coupons').delete().eq('id', id);
    _couponsCache.clear();
  }
}
