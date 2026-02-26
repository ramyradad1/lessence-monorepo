import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final categoriesRepositoryProvider = Provider<CategoriesRepository>((ref) {
  return CategoriesRepository(ref.read(supabaseClientProvider));
});

class CategoriesRepository extends BaseRepository {
  CategoriesRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _categoriesCache = CacheManager(ttl: const Duration(minutes: 60));

  Future<List<Map<String, dynamic>>> getCategories({bool forceRefresh = false}) async {
    const cacheKey = 'all_categories';
    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _categoriesCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client.from('categories').select().order('name_en');
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  Future<void> saveCategory(Map<String, dynamic> data) async {
    if (data['id'] != null) {
      await client.from('categories').update(data).eq('id', data['id']);
    } else {
      await client.from('categories').insert(data);
    }
    _categoriesCache.clear();
  }

  Future<void> deleteCategory(String id) async {
    await client.from('categories').delete().eq('id', id);
    _categoriesCache.clear();
  }
}
