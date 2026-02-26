import 'package:supabase_flutter/supabase_flutter.dart';
import 'cache_manager.dart';
import 'deduplicator_mixin.dart';

abstract class BaseRepository with DeduplicatorMixin {
  final SupabaseClient client;
  
  BaseRepository(this.client);

  /// Helper to get the authenticated user ID
  String? get currentUserId => client.auth.currentUser?.id;

  /// Generic fetch method that combines deduplication and caching.
  Future<T> fetchWithCache<T>({
    required String cacheKey,
    required Future<T> Function() fetcher,
    required CacheManager<T> cache,
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh) {
      final cachedResult = cache.get(cacheKey);
      if (cachedResult != null) {
        return cachedResult;
      }
    }

    return deduplicate(cacheKey, () async {
      final result = await fetcher();
      cache.set(cacheKey, result);
      return result;
    });
  }
}
