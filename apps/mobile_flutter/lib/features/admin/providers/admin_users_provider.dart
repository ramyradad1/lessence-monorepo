import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/users_repository.dart';
import '../models/admin_user_model.dart';

final adminUsersProvider = AsyncNotifierProvider<AdminUsersNotifier, List<AdminUser>>(
  AdminUsersNotifier.new,
);

class AdminUsersNotifier extends AsyncNotifier<List<AdminUser>> {
  @override
  Future<List<AdminUser>> build() async {
    return _fetchUsers();
  }

  int _currentPage = 1;
  final int _pageSize = 30;

  Future<List<AdminUser>> _fetchUsers({bool forceRefresh = false}) async {
    final repository = ref.watch(usersRepositoryProvider);
    final response = await repository.getUsers(
      page: _currentPage,
      pageSize: _pageSize,
      forceRefresh: forceRefresh,
    );

    return response.map((e) => AdminUser.fromMap(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    _currentPage = 1;
    state = await AsyncValue.guard(() => _fetchUsers(forceRefresh: true));
  }

  Future<void> loadMore() async {
    final currentData = state.value ?? [];
    if (currentData.isEmpty || currentData.length < _currentPage * _pageSize) {
      return; // No more data to load
    }

    _currentPage++;
    final moreData = await _fetchUsers();
    state = AsyncData([...currentData, ...moreData]);
  }

  Future<void> updateUserRole(String id, String newRole) async {
    final repository = ref.read(usersRepositoryProvider);
    await repository.updateUserRole(id, newRole);
    await refresh();
  }
}
