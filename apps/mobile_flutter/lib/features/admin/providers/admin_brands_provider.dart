import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/brands_repository.dart';
import '../models/admin_brand_model.dart';

final adminBrandsProvider = AsyncNotifierProvider<AdminBrandsNotifier, List<AdminBrand>>(
  AdminBrandsNotifier.new,
);

class AdminBrandsNotifier extends AsyncNotifier<List<AdminBrand>> {
  @override
  Future<List<AdminBrand>> build() async {
    return _fetchBrands();
  }

  Future<List<AdminBrand>> _fetchBrands({bool forceRefresh = false}) async {
    final repository = ref.watch(brandsRepositoryProvider);
    final response = await repository.getBrands(forceRefresh: forceRefresh);
    return response.map((e) => AdminBrand.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchBrands(forceRefresh: true));
  }

  Future<void> createBrand(Map<String, dynamic> data) async {
    final repository = ref.read(brandsRepositoryProvider);
    await repository.saveBrand(data);
    await refresh();
  }

  Future<void> updateBrand(String id, Map<String, dynamic> data) async {
    final repository = ref.read(brandsRepositoryProvider);
    data['id'] = id;
    await repository.saveBrand(data);
    await refresh();
  }

  Future<void> deleteBrand(String id) async {
    final repository = ref.read(brandsRepositoryProvider);
    await repository.deleteBrand(id);
    await refresh();
  }
}
