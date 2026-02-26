import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/collections_repository.dart';
import '../models/admin_collection_model.dart';

final adminCollectionsProvider = AsyncNotifierProvider<AdminCollectionsNotifier, List<AdminCollection>>(
  AdminCollectionsNotifier.new,
);

class AdminCollectionsNotifier extends AsyncNotifier<List<AdminCollection>> {
  @override
  Future<List<AdminCollection>> build() async {
    return _fetchCollections();
  }

  Future<List<AdminCollection>> _fetchCollections({bool forceRefresh = false}) async {
    final repository = ref.watch(collectionsRepositoryProvider);
    final response = await repository.getCollections(forceRefresh: forceRefresh);
    return response.map((e) => AdminCollection.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchCollections(forceRefresh: true));
  }

  Future<void> createCollection(Map<String, dynamic> data) async {
    final repository = ref.read(collectionsRepositoryProvider);
    await repository.saveCollection(data);
    await refresh();
  }

  Future<void> updateCollection(String id, Map<String, dynamic> data) async {
    final repository = ref.read(collectionsRepositoryProvider);
    data['id'] = id;
    await repository.saveCollection(data);
    await refresh();
  }

  Future<void> deleteCollection(String id) async {
    final repository = ref.read(collectionsRepositoryProvider);
    await repository.deleteCollection(id);
    await refresh();
  }
}
