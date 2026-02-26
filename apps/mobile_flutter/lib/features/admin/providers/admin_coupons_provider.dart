import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/coupons_repository.dart';
import '../models/admin_coupon_model.dart';

final adminCouponsProvider = AsyncNotifierProvider<AdminCouponsNotifier, List<AdminCoupon>>(
  AdminCouponsNotifier.new,
);

class AdminCouponsNotifier extends AsyncNotifier<List<AdminCoupon>> {
  @override
  Future<List<AdminCoupon>> build() async {
    return _fetchCoupons();
  }

  Future<List<AdminCoupon>> _fetchCoupons({bool forceRefresh = false}) async {
    final repository = ref.watch(couponsRepositoryProvider);
    final response = await repository.getCoupons(forceRefresh: forceRefresh);
    return response.map((e) => AdminCoupon.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchCoupons(forceRefresh: true));
  }

  Future<void> createCoupon(Map<String, dynamic> data) async {
    final repository = ref.read(couponsRepositoryProvider);
    await repository.saveCoupon(data);
    await refresh();
  }

  Future<void> updateCoupon(String id, Map<String, dynamic> data) async {
    final repository = ref.read(couponsRepositoryProvider);
    data['id'] = id;
    await repository.saveCoupon(data);
    await refresh();
  }

  Future<void> deleteCoupon(String id) async {
    final repository = ref.read(couponsRepositoryProvider);
    await repository.deleteCoupon(id);
    await refresh();
  }
}
