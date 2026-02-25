import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../localization/app_localizations.dart';
import '../providers/locale_provider.dart';

class LanguageMenuButton extends ConsumerWidget {
  const LanguageMenuButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLanguage = ref.watch(appLanguagePreferenceProvider);
    final localeController = ref.read(localeControllerProvider.notifier);
    final l10n = context.l10n;

    return PopupMenuButton<AppLanguage>(
      tooltip: l10n.language,
      icon: const Icon(Icons.language),
      initialValue: selectedLanguage,
      onSelected: (language) => localeController.setLanguage(language),
      itemBuilder: (context) => [
        CheckedPopupMenuItem<AppLanguage>(
          value: AppLanguage.system,
          checked: selectedLanguage == AppLanguage.system,
          child: Text(l10n.languageSystem),
        ),
        CheckedPopupMenuItem<AppLanguage>(
          value: AppLanguage.english,
          checked: selectedLanguage == AppLanguage.english,
          child: Text(l10n.languageEnglish),
        ),
        CheckedPopupMenuItem<AppLanguage>(
          value: AppLanguage.arabic,
          checked: selectedLanguage == AppLanguage.arabic,
          child: Text(l10n.languageArabic),
        ),
      ],
    );
  }
}
