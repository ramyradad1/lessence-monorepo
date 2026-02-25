import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'shared_preferences_provider.dart';

enum AppLanguage { system, english, arabic }

final localeControllerProvider = NotifierProvider<LocaleController, Locale?>(
  LocaleController.new,
);

final appLanguagePreferenceProvider = Provider<AppLanguage>((ref) {
  final locale = ref.watch(localeControllerProvider);
  if (locale == null) {
    return AppLanguage.system;
  }

  return switch (locale.languageCode) {
    'ar' => AppLanguage.arabic,
    'en' => AppLanguage.english,
    _ => AppLanguage.system,
  };
});

class LocaleController extends Notifier<Locale?> {
  static const _preferenceKey = 'app_language';

  @override
  Locale? build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    final storedLanguageCode = prefs.getString(_preferenceKey);

    return switch (storedLanguageCode) {
      'en' => const Locale('en'),
      'ar' => const Locale('ar'),
      _ => null,
    };
  }

  Future<void> setLanguage(AppLanguage language) async {
    final prefs = ref.read(sharedPreferencesProvider);

    switch (language) {
      case AppLanguage.system:
        await prefs.remove(_preferenceKey);
        state = null;
        return;
      case AppLanguage.english:
        await prefs.setString(_preferenceKey, 'en');
        state = const Locale('en');
        return;
      case AppLanguage.arabic:
        await prefs.setString(_preferenceKey, 'ar');
        state = const Locale('ar');
        return;
    }
  }
}
