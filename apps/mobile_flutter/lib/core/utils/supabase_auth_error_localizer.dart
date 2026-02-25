import 'package:supabase_flutter/supabase_flutter.dart';

import '../localization/app_localizations.dart';

class SupabaseAuthErrorLocalizer {
  const SupabaseAuthErrorLocalizer._();

  static String localize(AuthException error, AppLocalizations l10n) {
    final message = error.message.trim();
    if (message.isEmpty) {
      return l10n.text('unexpectedError');
    }

    final normalized = message.toLowerCase();

    if (normalized.contains('invalid login credentials')) {
      return l10n.text('authInvalidCredentials');
    }
    if (normalized.contains('email not confirmed')) {
      return l10n.text('authEmailNotConfirmed');
    }
    if (normalized.contains('user already registered') ||
        normalized.contains('already registered')) {
      return l10n.text('authEmailAlreadyRegistered');
    }
    if (normalized.contains('password should be at least') ||
        normalized.contains('weak password')) {
      return l10n.text('authWeakPassword');
    }
    if (normalized.contains('rate limit') ||
        normalized.contains('too many requests')) {
      return l10n.text('authTooManyRequests');
    }
    if (normalized.contains('failed host lookup') ||
        normalized.contains('network') ||
        normalized.contains('socketexception') ||
        normalized.contains('timed out')) {
      return l10n.text('authNetworkError');
    }

    return l10n.text('unexpectedError');
  }
}
