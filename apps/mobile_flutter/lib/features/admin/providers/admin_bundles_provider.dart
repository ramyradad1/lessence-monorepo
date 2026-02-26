import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/gift_sets_repository.dart';
import '../models/admin_bundle_model.dart';

final adminBundlesProvider = AsyncNotifierProvider<AdminBundlesNotifier, List<AdminBundle>>(
  AdminBundlesNotifier.new,
);

class AdminBundlesNotifier extends AsyncNotifier<List<AdminBundle>> {
  @override
  Future<List<AdminBundle>> build() async {
    return _fetchBundles();
  }

  Future<List<AdminBundle>> _fetchBundles({bool forceRefresh = false}) async {
    final repository = ref.watch(giftSetsRepositoryProvider);
    final response = await repository.getGiftSets(forceRefresh: forceRefresh);
    return response.map((e) => AdminBundle.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchBundles(forceRefresh: true));
  }

  Future<void> createBundle(Map<String, dynamic> data) async {
    final repository = ref.read(giftSetsRepositoryProvider);
    await repository.saveGiftSet(data);
    await refresh();
  }

  Future<void> updateBundle(String id, Map<String, dynamic> data) async {
    final repository = ref.read(giftSetsRepositoryProvider);
    data['id'] = id;
    await repository.saveGiftSet(data);
    await refresh();
  }

  Future<void> deleteBundle(String id) async {
    final repository = ref.read(giftSetsRepositoryProvider);
    await repository.deleteGiftSet(id);
    await refresh();
  }
}
