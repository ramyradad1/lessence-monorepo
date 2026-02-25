import 'package:flutter/material.dart';

bool isArabicLocale(Locale locale) =>
    locale.languageCode.toLowerCase().startsWith('ar');

String localizedValue(
  Locale locale, {
  String? base,
  String? english,
  String? arabic,
}) {
  if (isArabicLocale(locale)) {
    return (arabic ?? english ?? base ?? '').trim();
  }
  return (english ?? base ?? arabic ?? '').trim();
}
