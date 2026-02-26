import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/categories_repository.dart';
import '../../catalog/models/catalog_models.dart';

final adminCategoriesProvider = AsyncNotifierProvider<AdminCategoriesNotifier, List<CatalogCategory>>(
  AdminCategoriesNotifier.new,
);

class AdminCategoriesNotifier extends AsyncNotifier<List<CatalogCategory>> {
  int _currentPage = 1;
  bool _hasMore = true;

  @override
  Future<List<CatalogCategory>> build() async {
    _currentPage = 1;
    _hasMore = true;
    return _fetchCategories(page: _currentPage);
  }

  Future<List<CatalogCategory>> _fetchCategories({required int page, bool forceRefresh = false}) async {
    final repository = ref.watch(categoriesRepositoryProvider);
    final response = await repository.getCategories(
      forceRefresh: forceRefresh,
    );
    
    // Categories usually don't need pagination, load all
    _hasMore = false;

    return response.map((e) => CatalogCategory.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    _currentPage = 1;
    _hasMore = true;
    state = await AsyncValue.guard(() => _fetchCategories(page: _currentPage, forceRefresh: true));
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading || state.isReloading) return;
    
    final currentList = state.asData?.value ?? [];
    _currentPage++;
    
    try {
      final newList = await _fetchCategories(page: _currentPage);
      state = AsyncData([...currentList, ...newList]);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> createCategory(Map<String, dynamic> data) async {
    final repository = ref.read(categoriesRepositoryProvider);
    await repository.saveCategory(data);
    await refresh();
  }

  Future<void> updateCategory(String id, Map<String, dynamic> data) async {
    final repository = ref.read(categoriesRepositoryProvider);
    final updateData = {'id': id, ...data};
    await repository.saveCategory(updateData);
    await refresh();
  }

  Future<void> deleteCategory(String id) async {
    final repository = ref.read(categoriesRepositoryProvider);
    await repository.deleteCategory(id);
    await refresh();
  }
}
