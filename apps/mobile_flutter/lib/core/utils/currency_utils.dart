import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'locale_utils.dart';

String formatEgp(num amount, Locale locale) {
  final formatter = NumberFormat.currency(
    locale: isArabicLocale(locale) ? 'ar_EG' : 'en_EG',
    name: 'EGP',
    symbol: 'EGP',
    decimalDigits: 2,
  );
  return formatter.format(amount);
}
