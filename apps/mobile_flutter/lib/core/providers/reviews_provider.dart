import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import '../utils/fetch_logger.dart';

final reviewsRepositoryProvider = Provider<ReviewsRepository>((ref) {
  return ReviewsRepository(ref.watch(supabaseClientProvider));
});

class ReviewsRepository {
  ReviewsRepository(this._supabase);
  final SupabaseClient _supabase;

  Future<List<Map<String, dynamic>>> fetchProductReviews(String productId) async {
    final res = await _supabase
        .from('product_reviews')
        .select('''
          *,
          profiles!product_reviews_user_id_fkey(full_name)
        ''')
        .eq('product_id', productId)
        .eq('is_approved', true) // Typically we only show approved reviews
        .order('created_at', ascending: false)
        .executeAndLog('ReviewsRepository:fetchProductReviews: \$productId');
        
    return (res as List).map((row) => Map<String, dynamic>.from(row as Map)).toList();
  }

  Future<Map<String, dynamic>?> fetchUserReview(String productId, String userId) async {
    final res = await _supabase
        .from('product_reviews')
        .select()
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle(); // we don't log maybeSingle right now
        
    if (res == null) return null;
    return Map<String, dynamic>.from(res as Map);
  }

  Future<bool> checkCanReview(String productId, String userId) async {
    // Check if they have an order with this product
    final res = await _supabase
        .from('order_items')
        .select('id, orders!inner(user_id)')
        .eq('product_id', productId)
        .eq('orders.user_id', userId)
        // Ideally we check if order status is delivered, but just checking purchase history
        .limit(1)
        .executeAndLog('ReviewsRepository:checkCanReview: \$productId');
        
    return res.isNotEmpty;
  }

  Future<void> submitReview({
    required String productId,
    required String userId,
    required int rating,
    String? comment,
  }) async {
    await _supabase.from('product_reviews').upsert({
      'product_id': productId,
      'user_id': userId,
      'rating': rating,
      'comment': comment,
      'updated_at': DateTime.now().toIso8601String(),
    });
  }

  Future<void> deleteReview(String productId, String userId) async {
    await _supabase
        .from('product_reviews')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', userId);
  }
}

final productReviewsProvider = FutureProvider.family<List<AppReview>, String>((ref, productId) async {
  final repo = ref.read(reviewsRepositoryProvider);
  final rows = await repo.fetchProductReviews(productId);
  return rows.map((row) => AppReview.fromJson(row)).toList();
});

final userReviewProvider = FutureProvider.family<AppReview?, String>((ref, productId) async {
  final session = ref.watch(sessionProvider);
  if (session == null) return null;

  final repo = ref.read(reviewsRepositoryProvider);
  final row = await repo.fetchUserReview(productId, session.user.id);
      
  if (row == null) return null;
  return AppReview.fromJson(row);
});

final canReviewProvider = FutureProvider.family<bool, String>((ref, productId) async {
  final session = ref.watch(sessionProvider);
  if (session == null) return false;

  final repo = ref.read(reviewsRepositoryProvider);
  return await repo.checkCanReview(productId, session.user.id);
});

final reviewsControllerProvider = Provider<ReviewsController>((ref) {
  return ReviewsController(ref);
});

class ReviewsController {
  ReviewsController(this.ref);
  final Ref ref;

  ReviewsRepository get _repository => ref.read(reviewsRepositoryProvider);

  Future<void> submitReview({
    required String productId,
    required int rating,
    String? comment,
  }) async {
    final session = ref.read(sessionProvider);
    if (session == null) throw Exception('Must be logged in to review');

    await _repository.submitReview(
      productId: productId,
      userId: session.user.id,
      rating: rating,
      comment: comment,
    );

    ref.invalidate(userReviewProvider(productId));
    ref.invalidate(productReviewsProvider(productId));
  }

  Future<void> deleteReview(String productId) async {
    final session = ref.read(sessionProvider);
    if (session == null) throw Exception('Must be logged in to delete review');

    await _repository.deleteReview(productId, session.user.id);

    ref.invalidate(userReviewProvider(productId));
    ref.invalidate(productReviewsProvider(productId));
  }
}
