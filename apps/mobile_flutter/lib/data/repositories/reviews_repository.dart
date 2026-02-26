import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../supabase/supabase_client.dart';
import 'core/base_repository.dart';
import 'core/cache_manager.dart';

final reviewsRepositoryProvider = Provider<ReviewsRepository>((ref) {
  return ReviewsRepository(ref.read(supabaseClientProvider));
});

class ReviewsRepository extends BaseRepository {
  ReviewsRepository(super.client);

  final CacheManager<List<Map<String, dynamic>>> _reviewsCache = CacheManager(ttl: const Duration(minutes: 10));

  Future<List<Map<String, dynamic>>> getAdminReviews({
    int page = 1,
    int pageSize = 20,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'admin_reviews_page_${page}_size_$pageSize';
    final offset = (page - 1) * pageSize;

    return fetchWithCache(
      cacheKey: cacheKey,
      cache: _reviewsCache,
      forceRefresh: forceRefresh,
      fetcher: () async {
        final response = await client
            .from('reviews')
            .select('''
              *,
              products(name_en),
              profiles(first_name, last_name, email)
            ''')
            .order('created_at', ascending: false)
            .range(offset, offset + pageSize - 1);
        return List<Map<String, dynamic>>.from(response);
      },
    );
  }

  /// Moderate reviews using the RPC
  Future<void> moderateReviews(List<String> reviewIds, String status, {String? adminNote}) async {
    await client.rpc('moderate_reviews', params: {
      'p_review_ids': reviewIds,
      'p_status': status,
      'p_admin_note': adminNote,
    });
    _reviewsCache.clear();
  }
}
