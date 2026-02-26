import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final giftSetsRepositoryProvider = Provider<GiftSetsRepository>((ref) {
  return GiftSetsRepository(ref.read(supabaseClientProvider));
});

class GiftSetsRepository extends BaseRepository {
  GiftSetsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _giftSetsCache = CacheManager(ttl: const Duration(minutes: 30));

  Future<List<Map<String, dynamic>>> getGiftSets({bool forceRefresh = false}) async {
    const cacheKey = 'all_gift_sets';
    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _giftSetsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.from('bundles').select().order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  Future<void> saveGiftSet(Map<String, dynamic> data) async {
    if (data['id'] != null) {
      await client.from('bundles').update(data).eq('id', data['id']);
    } else {
      await client.from('bundles').insert(data);
    }
    _giftSetsCache.clear();
  }

  Future<void> deleteGiftSet(String id) async {
    await client.from('bundles').delete().eq('id', id);
    _giftSetsCache.clear();
  }
}
