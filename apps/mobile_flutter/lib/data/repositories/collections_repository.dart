import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final collectionsRepositoryProvider = Provider<CollectionsRepository>((ref) {
  return CollectionsRepository(ref.read(supabaseClientProvider));
});

class CollectionsRepository extends BaseRepository {
  CollectionsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _collectionsCache = CacheManager(ttl: const Duration(minutes: 30));

  Future<List<Map<String, dynamic>>> getCollections({bool forceRefresh = false}) async {
    const cacheKey = 'all_collections';
    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _collectionsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.from('collections').select().order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  Future<void> saveCollection(Map<String, dynamic> data) async {
    if (data['id'] != null) {
      await client.from('collections').update(data).eq('id', data['id']);
    } else {
      await client.from('collections').insert(data);
    }
    _collectionsCache.clear();
  }

  Future<void> deleteCollection(String id) async {
    await client.from('collections').delete().eq('id', id);
    _collectionsCache.clear();
  }
}
