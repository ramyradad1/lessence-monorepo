import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/auth_provider.dart';
import '../models/admin_setting_model.dart';

final adminSettingsProvider = AsyncNotifierProvider<AdminSettingsNotifier, List<AdminSetting>>(
  AdminSettingsNotifier.new,
);

class AdminSettingsNotifier extends AsyncNotifier<List<AdminSetting>> {
  @override
  Future<List<AdminSetting>> build() async {
    return _fetchSettings();
  }

  Future<List<AdminSetting>> _fetchSettings() async {
    final supabase = ref.watch(supabaseClientProvider);
    final response = await supabase
        .from('store_settings')
        .select()
        .order('key', ascending: true);

    return (response as List<dynamic>)
        .map((e) => AdminSetting.fromMap(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchSettings());
  }

  Future<void> updateSetting(String key, Map<String, dynamic> value) async {
    final supabase = ref.read(supabaseClientProvider);
    await supabase.from('store_settings').update({
      'value': value,
    }).eq('key', key);
    await refresh();
  }
}
