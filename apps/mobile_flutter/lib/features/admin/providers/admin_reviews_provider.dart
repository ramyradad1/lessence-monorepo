import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../data/repositories/reviews_repository.dart';
import '../models/admin_review_model.dart';

final adminReviewsProvider = AsyncNotifierProvider<AdminReviewsNotifier, List<AdminReview>>(
  AdminReviewsNotifier.new,
);

class AdminReviewsNotifier extends AsyncNotifier<List<AdminReview>> {
  @override
  Future<List<AdminReview>> build() async {
    return _fetchReviews();
  }

  int _currentPage = 1;
  final int _pageSize = 20;

  Future<List<AdminReview>> _fetchReviews({bool forceRefresh = false}) async {
    final repository = ref.watch(reviewsRepositoryProvider);
    final response = await repository.getAdminReviews(
      page: _currentPage,
      pageSize: _pageSize,
      forceRefresh: forceRefresh,
    );

    return response.map((e) => AdminReview.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    _currentPage = 1;
    state = await AsyncValue.guard(() => _fetchReviews(forceRefresh: true));
  }

  Future<void> loadMore() async {
    final currentData = state.value ?? [];
    if (currentData.isEmpty || currentData.length < _currentPage * _pageSize) {
      return; // No more data to load
    }

    _currentPage++;
    final moreData = await _fetchReviews();
    state = AsyncData([...currentData, ...moreData]);
  }

  Future<void> updateReviewStatus(String id, bool isApproved) async {
    final repository = ref.read(reviewsRepositoryProvider);
    final status = isApproved ? 'approved' : 'rejected';
    await repository.moderateReviews([id], status);
    await refresh();
  }

  Future<void> deleteReview(String id) async {
    // Delete is currently not in the repository, falling back to direct
    final supabase = ref.read(supabaseClientProvider);
    await supabase.from('reviews').delete().eq('id', id);
    await refresh();
  }
}
