import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final brandsRepositoryProvider = Provider<BrandsRepository>((ref) {
  return BrandsRepository(ref.read(supabaseClientProvider));
});

class BrandsRepository extends BaseRepository {
  BrandsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _brandsCache = CacheManager(ttl: const Duration(minutes: 60));

  Future<List<Map<String, dynamic>>> getBrands({bool forceRefresh = false}) async {
    const cacheKey = 'all_brands';
    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _brandsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.from('brands').select().order('name_en');
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }
  
  Future<void> saveBrand(Map<String, dynamic> data) async {
    if (data['id'] != null) {
      await client.from('brands').update(data).eq('id', data['id']);
    } else {
      await client.from('brands').insert(data);
    }
    _brandsCache.clear();
  }

  Future<void> deleteBrand(String id) async {
    await client.from('brands').delete().eq('id', id);
    _brandsCache.clear();
  }
}
