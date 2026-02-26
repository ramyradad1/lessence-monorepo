import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final usersRepositoryProvider = Provider<UsersRepository>((ref) {
  return UsersRepository(ref.read(supabaseClientProvider));
});

class UsersRepository extends BaseRepository {
  UsersRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _usersCache = CacheManager(ttl: const Duration(minutes: 15));

  Future<List<Map<String, dynamic>>> getUsers({
    int page = 1,
    int pageSize = 30,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'users_page_${page}_size_$pageSize';
    final offset = (page - 1) * pageSize;

    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _usersCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client
            .from('profiles')
            .select() // Profiles table holds role mappings
            .order('created_at', ascending: false)
            .range(offset, offset + pageSize - 1);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  Future<void> updateUserRole(String profileId, String role) async {
    await client.from('profiles').update({'role': role}).eq('id', profileId);
    _usersCache.clear();
  }
}
