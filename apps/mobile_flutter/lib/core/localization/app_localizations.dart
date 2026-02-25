import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = <Locale>[Locale('en'), Locale('ar')];

  static const localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    AppLocalizationsDelegate(),
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  static AppLocalizations of(BuildContext context) {
    final localizations = Localizations.of<AppLocalizations>(
      context,
      AppLocalizations,
    );
    assert(localizations != null, 'AppLocalizations not found in context.');
    return localizations!;
  }

  static Locale resolveLocale(
    Locale? deviceLocale,
    Iterable<Locale> supportedLocales,
  ) {
    if (deviceLocale == null) {
      return supportedLocales.first;
    }

    for (final locale in supportedLocales) {
      if (locale.languageCode == deviceLocale.languageCode) {
        return locale;
      }
    }

    return AppLocalizations.supportedLocales.first;
  }

  static const Map<String, Map<String, String>> _strings = {
    'en': {
      'appTitle': 'L\'Essence Mobile',
      'brandName': 'L\'Essence',
      'language': 'Language',
      'languageSystem': 'System Default',
      'languageEnglish': 'English',
      'languageArabic': 'Arabic',
      'loading': 'Loading...',
      'refresh': 'Refresh',
      'save': 'Save',
      'cancel': 'Cancel',
      'delete': 'Delete',
      'edit': 'Edit',
      'add': 'Add',
      'close': 'Close',
      'emailLabel': 'Email',
      'passwordLabel': 'Password',
      'fullNameLabel': 'Full name',
      'phoneLabel': 'Phone',
      'loginTitle': 'Sign in',
      'signIn': 'Sign In',
      'signUp': 'Sign Up',
      'signOut': 'Sign Out',
      'createAccount': 'Create account',
      'alreadyHaveAccount': 'Already have an account? Sign in',
      'needAccount': 'Need an account? Sign up',
      'emailConfirmationHint':
          'Account created. If email confirmation is enabled, check your inbox before signing in.',
      'passwordTooShort': 'Password must be at least 6 characters',
      'fillRequiredFields': 'Please fill in required fields',
      'invalidEmail': 'Please enter a valid email address',
      'authInvalidCredentials': 'Invalid email or password',
      'authEmailNotConfirmed': 'Please confirm your email before signing in',
      'authEmailAlreadyRegistered': 'This email is already registered',
      'authWeakPassword': 'Password is too weak',
      'authTooManyRequests': 'Too many attempts. Please try again later',
      'authNetworkError': 'Network error. Check your connection and try again',
      'unexpectedError': 'An unexpected error occurred',
      'shopTab': 'Shop',
      'favoritesTab': 'Favorites',
      'cartTab': 'Cart',
      'profileTab': 'Profile',
      'products': 'Products',
      'noProducts': 'No products available',
      'addToCart': 'Add to cart',
      'cart': 'Cart',
      'cartEmpty': 'Your cart is empty',
      'clearCart': 'Clear cart',
      'qty': 'Qty',
      'total': 'Total',
      'favorites': 'Favorites',
      'favoritesEmpty': 'No favorites yet',
      'removeFavorite': 'Remove favorite',
      'profile': 'Profile',
      'profileRowMissing':
          'Profile row is not available yet. You can still use your account and addresses.',
      'profileInfo': 'Profile information',
      'addresses': 'Addresses',
      'addressesEmpty': 'No saved addresses',
      'addAddress': 'Add address',
      'editAddress': 'Edit address',
      'addressLine1': 'Address line 1',
      'addressLine2': 'Address line 2',
      'city': 'City',
      'state': 'State',
      'postalCode': 'Postal code',
      'country': 'Country',
      'defaultAddress': 'Default address',
      'saveProfile': 'Save profile',
      'saveAddress': 'Save address',
      'newAddress': 'New address',
      'logout': 'Logout',
      'syncing': 'Syncing...',
    },
    'ar': {
      'appTitle': 'تطبيق L\'Essence',
      'brandName': 'L\'Essence',
      'language': 'اللغة',
      'languageSystem': 'لغة الجهاز',
      'languageEnglish': 'الإنجليزية',
      'languageArabic': 'العربية',
      'loading': 'جارٍ التحميل...',
      'refresh': 'تحديث',
      'save': 'حفظ',
      'cancel': 'إلغاء',
      'delete': 'حذف',
      'edit': 'تعديل',
      'add': 'إضافة',
      'close': 'إغلاق',
      'emailLabel': 'البريد الإلكتروني',
      'passwordLabel': 'كلمة المرور',
      'fullNameLabel': 'الاسم الكامل',
      'phoneLabel': 'الهاتف',
      'loginTitle': 'تسجيل الدخول',
      'signIn': 'تسجيل الدخول',
      'signUp': 'إنشاء حساب',
      'signOut': 'تسجيل الخروج',
      'createAccount': 'إنشاء حساب',
      'alreadyHaveAccount': 'لديك حساب بالفعل؟ سجّل الدخول',
      'needAccount': 'تحتاج حسابًا؟ أنشئ حسابًا',
      'emailConfirmationHint':
          'تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، تحقق من بريدك قبل تسجيل الدخول.',
      'passwordTooShort': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      'fillRequiredFields': 'يرجى تعبئة الحقول المطلوبة',
      'invalidEmail': 'يرجى إدخال بريد إلكتروني صحيح',
      'authInvalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'authEmailNotConfirmed': 'يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول',
      'authEmailAlreadyRegistered': 'هذا البريد الإلكتروني مسجل بالفعل',
      'authWeakPassword': 'كلمة المرور ضعيفة جدًا',
      'authTooManyRequests': 'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا',
      'authNetworkError': 'خطأ في الشبكة. تحقق من الاتصال ثم حاول مرة أخرى',
      'unexpectedError': 'حدث خطأ غير متوقع',
      'shopTab': 'المتجر',
      'favoritesTab': 'المفضلة',
      'cartTab': 'السلة',
      'profileTab': 'الحساب',
      'products': 'المنتجات',
      'noProducts': 'لا توجد منتجات متاحة',
      'addToCart': 'أضف إلى السلة',
      'cart': 'السلة',
      'cartEmpty': 'سلتك فارغة',
      'clearCart': 'إفراغ السلة',
      'qty': 'الكمية',
      'total': 'الإجمالي',
      'favorites': 'المفضلة',
      'favoritesEmpty': 'لا توجد مفضلة بعد',
      'removeFavorite': 'إزالة من المفضلة',
      'profile': 'الحساب',
      'profileRowMissing':
          'سجل الملف الشخصي غير متاح بعد. لا يزال بإمكانك استخدام الحساب والعناوين.',
      'profileInfo': 'بيانات الحساب',
      'addresses': 'العناوين',
      'addressesEmpty': 'لا توجد عناوين محفوظة',
      'addAddress': 'إضافة عنوان',
      'editAddress': 'تعديل العنوان',
      'addressLine1': 'العنوان 1',
      'addressLine2': 'العنوان 2',
      'city': 'المدينة',
      'state': 'المحافظة',
      'postalCode': 'الرمز البريدي',
      'country': 'الدولة',
      'defaultAddress': 'العنوان الافتراضي',
      'saveProfile': 'حفظ الحساب',
      'saveAddress': 'حفظ العنوان',
      'newAddress': 'عنوان جديد',
      'logout': 'تسجيل الخروج',
      'syncing': 'جارٍ المزامنة...',
    },
  };

  String _effectiveLanguageCode() {
    return _strings.containsKey(locale.languageCode) ? locale.languageCode : 'en';
  }

  String text(String key, {Map<String, String> args = const {}}) {
    final value =
        _strings[_effectiveLanguageCode()]?[key] ?? _strings['en']?[key] ?? key;

    var formatted = value;
    for (final entry in args.entries) {
      formatted = formatted.replaceAll('{${entry.key}}', entry.value);
    }
    return formatted;
  }

  String get appTitle => text('appTitle');
  String get brandName => text('brandName');
  String get language => text('language');
  String get languageSystem => text('languageSystem');
  String get languageEnglish => text('languageEnglish');
  String get languageArabic => text('languageArabic');
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return AppLocalizations.supportedLocales.any(
      (supported) => supported.languageCode == locale.languageCode,
    );
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) {
    return false;
  }
}

extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
