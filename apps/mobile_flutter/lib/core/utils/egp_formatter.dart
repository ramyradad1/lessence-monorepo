import 'package:intl/intl.dart';

class EgpFormatter {
  const EgpFormatter._();

  static String format(
    num amount, {
    String? localeCode,
    int decimalDigits = 2,
  }) {
    final normalizedLocale = _normalizeLocale(localeCode);
    final isArabic = normalizedLocale.startsWith('ar');

    final formatter = NumberFormat.currency(
      locale: normalizedLocale,
      name: 'EGP',
      symbol: isArabic ? 'ج.م.‏' : 'EGP',
      decimalDigits: decimalDigits,
    );

    return formatter.format(amount);
  }

  static String _normalizeLocale(String? localeCode) {
    if (localeCode == null || localeCode.isEmpty) {
      return 'en_EG';
    }
    if (localeCode.startsWith('ar')) {
      return 'ar_EG';
    }
    if (localeCode.startsWith('en')) {
      return 'en_EG';
    }
    return localeCode;
  }
}
