import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../core/utils/locale_utils.dart';

class CatalogCategory {
  const CatalogCategory({
    required this.id,
    required this.slug,
    required this.name,
    this.nameEn,
    this.nameAr,
    this.description,
    this.descriptionEn,
    this.descriptionAr,
    this.imageUrl,
    this.icon,
    this.sortOrder,
  });

  final String id;
  final String slug;
  final String name;
  final String? nameEn;
  final String? nameAr;
  final String? description;
  final String? descriptionEn;
  final String? descriptionAr;
  final String? imageUrl;
  final String? icon;
  final int? sortOrder;

  factory CatalogCategory.fromMap(Map<String, dynamic> map) {
    return CatalogCategory(
      id: _asString(map['id']) ?? '',
      slug: _asString(map['slug']) ?? '',
      name:
          _asString(map['name']) ??
          _asString(map['name_en']) ??
          _asString(map['name_ar']) ??
          '',
      nameEn: _asString(map['name_en']),
      nameAr: _asString(map['name_ar']),
      description: _asString(map['description']),
      descriptionEn: _asString(map['description_en']),
      descriptionAr: _asString(map['description_ar']),
      imageUrl: _asString(map['image_url']),
      icon: _asString(map['icon']),
      sortOrder: _asInt(map['sort_order']),
    );
  }

  String localizedName(Locale locale) =>
      localizedValue(locale, base: name, english: nameEn, arabic: nameAr);

  String localizedDescription(Locale locale) => localizedValue(
    locale,
    base: description,
    english: descriptionEn,
    arabic: descriptionAr,
  );
}

class FragranceNotes {
  const FragranceNotes({
    required this.top,
    required this.heart,
    required this.base,
  });

  final List<String> top;
  final List<String> heart;
  final List<String> base;

  factory FragranceNotes.fromDynamic(dynamic value) {
    final map = _asMap(value) ?? const <String, dynamic>{};
    return FragranceNotes(
      top: _asStringList(map['top']),
      heart: _asStringList(map['heart']),
      base: _asStringList(map['base']),
    );
  }

  bool get hasContent => top.isNotEmpty || heart.isNotEmpty || base.isNotEmpty;
}

class ScentProfile {
  const ScentProfile({required this.name, this.nameEn, this.nameAr, this.icon});

  final String name;
  final String? nameEn;
  final String? nameAr;
  final String? icon;

  factory ScentProfile.fromDynamic(dynamic value) {
    if (value is String) {
      return ScentProfile(name: value);
    }
    final map = _asMap(value) ?? const <String, dynamic>{};
    return ScentProfile(
      name:
          _asString(map['name']) ??
          _asString(map['name_en']) ??
          _asString(map['name_ar']) ??
          '',
      nameEn: _asString(map['name_en']),
      nameAr: _asString(map['name_ar']),
      icon: _asString(map['icon']),
    );
  }

  String localizedName(Locale locale) =>
      localizedValue(locale, base: name, english: nameEn, arabic: nameAr);
}

enum StockStatus { inStock, lowStock, outOfStock, unknown }

class CatalogVariant {
  const CatalogVariant({
    required this.id,
    required this.productId,
    required this.price,
    required this.stockQty,
    this.sizeMl,
    this.concentration,
    this.concentrationEn,
    this.concentrationAr,
    this.sku,
    this.isActive = true,
    this.lowStockThreshold,
  });

  final String id;
  final String productId;
  final int? sizeMl;
  final String? concentration;
  final String? concentrationEn;
  final String? concentrationAr;
  final double price;
  final int stockQty;
  final String? sku;
  final bool isActive;
  final int? lowStockThreshold;

  factory CatalogVariant.fromMap(
    Map<String, dynamic> map, {
    double? fallbackBasePrice,
  }) {
    final directPrice = _asDouble(map['price']);
    final priceAdjustment = _asDouble(map['price_adjustment']) ?? 0;
    final computedPrice =
        directPrice ?? ((fallbackBasePrice ?? 0) + priceAdjustment);

    return CatalogVariant(
      id: _asString(map['id']) ?? '',
      productId: _asString(map['product_id']) ?? '',
      sizeMl: _asInt(map['size_ml']),
      concentration: _asString(map['concentration']),
      concentrationEn: _asString(map['concentration_en']),
      concentrationAr: _asString(map['concentration_ar']),
      price: computedPrice,
      stockQty: _asInt(map['stock_qty']) ?? _asInt(map['stock_quantity']) ?? 0,
      sku: _asString(map['sku']),
      isActive: _asBool(map['is_active']) ?? true,
      lowStockThreshold: _asInt(map['low_stock_threshold']),
    );
  }

  String localizedConcentration(Locale locale) => localizedValue(
    locale,
    base: concentration,
    english: concentrationEn,
    arabic: concentrationAr,
  );

  String displayLabel(Locale locale) {
    final parts = <String>[];
    if (sizeMl != null) {
      parts.add('${sizeMl}ml');
    }
    final localizedConc = localizedConcentration(locale);
    if (localizedConc.isNotEmpty) {
      parts.add(localizedConc);
    }
    return parts.join(' ');
  }

  StockStatus get stockStatus {
    if (stockQty <= 0) return StockStatus.outOfStock;
    final threshold = lowStockThreshold ?? 5;
    if (stockQty <= threshold) return StockStatus.lowStock;
    return StockStatus.inStock;
  }
}

class CatalogProductImage {
  const CatalogProductImage({
    required this.url,
    this.altEn,
    this.altAr,
    this.sortOrder = 0,
    this.isPrimary = false,
    this.variantId,
  });

  final String url;
  final String? altEn;
  final String? altAr;
  final int sortOrder;
  final bool isPrimary;
  final String? variantId;

  factory CatalogProductImage.fromMap(Map<String, dynamic> map) {
    return CatalogProductImage(
      url: _asString(map['image_url']) ?? _asString(map['url']) ?? '',
      altEn: _asString(map['alt_text_en']),
      altAr: _asString(map['alt_text_ar']),
      sortOrder: _asInt(map['sort_order']) ?? 0,
      isPrimary: _asBool(map['is_primary']) ?? false,
      variantId: _asString(map['variant_id']),
    );
  }
}

class CatalogProduct {
  const CatalogProduct({
    required this.id,
    required this.slug,
    required this.name,
    required this.price,
    required this.categoryId,
    this.nameEn,
    this.nameAr,
    this.subtitle,
    this.subtitleEn,
    this.subtitleAr,
    this.description,
    this.descriptionEn,
    this.descriptionAr,
    this.sku,
    this.imageUrl,
    this.imageUrls = const <String>[],
    this.categoryName,
    this.sizeOptions = const <CatalogSizeOption>[],
    this.variants = const <CatalogVariant>[],
    this.scentProfiles = const <ScentProfile>[],
    this.fragranceNotes,
    this.rating = 0,
    this.reviewCount = 0,
    this.isNew = false,
    this.isActive = true,
    this.isLimited = false,
    this.lowStockThreshold,
    this.genderTarget,
    this.stockQty,
    this.createdAt,
    this.productImages = const <CatalogProductImage>[],
  });

  final String id;
  final String slug;
  final String name;
  final String? nameEn;
  final String? nameAr;
  final String? subtitle;
  final String? subtitleEn;
  final String? subtitleAr;
  final String? description;
  final String? descriptionEn;
  final String? descriptionAr;
  final double price;
  final String? sku;
  final String? imageUrl;
  final List<String> imageUrls;
  final String categoryId;
  final String? categoryName;
  final List<CatalogSizeOption> sizeOptions;
  final List<CatalogVariant> variants;
  final List<ScentProfile> scentProfiles;
  final FragranceNotes? fragranceNotes;
  final double rating;
  final int reviewCount;
  final bool isNew;
  final bool isActive;
  final bool isLimited;
  final int? lowStockThreshold;
  final String? genderTarget;
  final int? stockQty;
  final DateTime? createdAt;
  final List<CatalogProductImage> productImages;

  factory CatalogProduct.fromMap(Map<String, dynamic> map) {
    final price = _asDouble(map['price']) ?? _asDouble(map['base_price']) ?? 0;
    final imagesField = _asList(map['images']);
    final imageUrls = <String>[
      for (final item in imagesField)
        ...(() {
          if (item is String) return [item];
          final itemMap = _asMap(item);
          final url =
              _asString(itemMap?['image_url']) ?? _asString(itemMap?['url']);
          return url == null ? <String>[] : <String>[url];
        }()),
    ];

    final variantsRaw = _asList(map['variants']);
    final variants =
        variantsRaw
            .map((e) => _asMap(e))
            .whereType<Map<String, dynamic>>()
            .map((e) => CatalogVariant.fromMap(e, fallbackBasePrice: price))
            .toList()
          ..sort(_variantSort);

    final sizeOptionsRaw = _asList(map['size_options']);
    final sizeOptions = sizeOptionsRaw
        .map((e) => _asMap(e))
        .whereType<Map<String, dynamic>>()
        .map(CatalogSizeOption.fromMap)
        .toList();

    final scentProfiles = _asList(
      map['scent_profiles'],
    ).map(ScentProfile.fromDynamic).where((e) => e.name.isNotEmpty).toList();

    final categoryId = _asString(map['category_id']) ?? '';
    final categoryName = _asString(_asMap(map['categories'])?['name']);

    final createdAt = _asDateTime(map['created_at']);
    final fragranceNotesValue = map.containsKey('fragrance_notes')
        ? FragranceNotes.fromDynamic(map['fragrance_notes'])
        : null;

    return CatalogProduct(
      id: _asString(map['id']) ?? '',
      slug: _asString(map['slug']) ?? '',
      name:
          _asString(map['name']) ??
          _asString(map['name_en']) ??
          _asString(map['name_ar']) ??
          '',
      nameEn: _asString(map['name_en']),
      nameAr: _asString(map['name_ar']),
      subtitle: _asString(map['subtitle']),
      subtitleEn: _asString(map['subtitle_en']),
      subtitleAr: _asString(map['subtitle_ar']),
      description: _asString(map['description']),
      descriptionEn: _asString(map['description_en']),
      descriptionAr: _asString(map['description_ar']),
      price: price,
      sku: _asString(map['sku']),
      imageUrl: _asString(map['image_url']),
      imageUrls: imageUrls,
      categoryId: categoryId,
      categoryName: categoryName,
      sizeOptions: sizeOptions,
      variants: variants,
      scentProfiles: scentProfiles,
      fragranceNotes: fragranceNotesValue,
      rating: _asDouble(map['rating']) ?? 0,
      reviewCount: _asInt(map['review_count']) ?? 0,
      isNew: _asBool(map['is_new']) ?? false,
      isActive: _asBool(map['is_active']) ?? true,
      isLimited: _asBool(map['is_limited']) ?? false,
      lowStockThreshold: _asInt(map['low_stock_threshold']),
      genderTarget: _asString(map['gender_target']),
      stockQty: _asInt(map['stock_qty']) ?? _asInt(map['stock_quantity']),
      createdAt: createdAt,
    );
  }

  CatalogProduct copyWith({
    List<CatalogVariant>? variants,
    List<CatalogProductImage>? productImages,
  }) {
    return CatalogProduct(
      id: id,
      slug: slug,
      name: name,
      price: price,
      categoryId: categoryId,
      nameEn: nameEn,
      nameAr: nameAr,
      subtitle: subtitle,
      subtitleEn: subtitleEn,
      subtitleAr: subtitleAr,
      description: description,
      descriptionEn: descriptionEn,
      descriptionAr: descriptionAr,
      sku: sku,
      imageUrl: imageUrl,
      imageUrls: imageUrls,
      categoryName: categoryName,
      sizeOptions: sizeOptions,
      variants: variants ?? this.variants,
      scentProfiles: scentProfiles,
      fragranceNotes: fragranceNotes,
      rating: rating,
      reviewCount: reviewCount,
      isNew: isNew,
      isActive: isActive,
      isLimited: isLimited,
      lowStockThreshold: lowStockThreshold,
      genderTarget: genderTarget,
      stockQty: stockQty,
      createdAt: createdAt,
      productImages: productImages ?? this.productImages,
    );
  }

  String localizedName(Locale locale) =>
      localizedValue(locale, base: name, english: nameEn, arabic: nameAr);

  String localizedSubtitle(Locale locale) => localizedValue(
    locale,
    base: subtitle,
    english: subtitleEn,
    arabic: subtitleAr,
  );

  String localizedDescription(Locale locale) => localizedValue(
    locale,
    base: description,
    english: descriptionEn,
    arabic: descriptionAr,
  );

  List<CatalogVariant> get activeVariants {
    final active = variants.where((v) => v.isActive).toList()
      ..sort(_variantSort);
    return active.isEmpty ? variants : active;
  }

  double get minAvailablePrice {
    final usableVariants = activeVariants;
    if (usableVariants.isNotEmpty) {
      return usableVariants.map((v) => v.price).reduce((a, b) => a < b ? a : b);
    }
    if (sizeOptions.isNotEmpty) {
      return sizeOptions.map((v) => v.price).reduce((a, b) => a < b ? a : b);
    }
    return price;
  }

  int get totalStock {
    if (activeVariants.isNotEmpty) {
      return activeVariants.fold<int>(0, (sum, v) => sum + v.stockQty);
    }
    return stockQty ?? -1;
  }

  StockStatus get overallStockStatus {
    if (activeVariants.isNotEmpty) {
      if (activeVariants.every((v) => v.stockQty <= 0)) {
        return StockStatus.outOfStock;
      }
      if (activeVariants.any((v) => v.stockStatus == StockStatus.lowStock)) {
        return StockStatus.lowStock;
      }
      return StockStatus.inStock;
    }
    if (stockQty == null) return StockStatus.unknown;
    if ((stockQty ?? 0) <= 0) return StockStatus.outOfStock;
    final threshold = lowStockThreshold ?? 5;
    if ((stockQty ?? 0) <= threshold) return StockStatus.lowStock;
    return StockStatus.inStock;
  }

  List<String> get galleryUrls {
    final urls = <String>[];
    if (productImages.isNotEmpty) {
      final sorted = [...productImages]
        ..sort((a, b) {
          if (a.isPrimary != b.isPrimary) {
            return a.isPrimary ? -1 : 1;
          }
          return a.sortOrder.compareTo(b.sortOrder);
        });
      urls.addAll(sorted.map((e) => e.url).where((e) => e.isNotEmpty));
    }
    if (imageUrls.isNotEmpty) {
      urls.addAll(imageUrls.where((e) => e.isNotEmpty));
    }
    if ((imageUrl ?? '').isNotEmpty) {
      urls.add(imageUrl!);
    }
    final unique = <String>{};
    return [
      for (final url in urls)
        if (unique.add(url)) url,
    ];
  }
}

class CatalogSizeOption {
  const CatalogSizeOption({required this.size, required this.price});

  final String size;
  final double price;

  factory CatalogSizeOption.fromMap(Map<String, dynamic> map) {
    return CatalogSizeOption(
      size: _asString(map['size']) ?? '',
      price: _asDouble(map['price']) ?? 0,
    );
  }
}

class CatalogSearchPage {
  const CatalogSearchPage({
    required this.items,
    required this.pageIndex,
    required this.hasMore,
  });

  final List<CatalogProduct> items;
  final int pageIndex;
  final bool hasMore;
}

class HomeCatalogData {
  const HomeCatalogData({
    required this.newArrivals,
    required this.featured,
    required this.categories,
  });

  final List<CatalogProduct> newArrivals;
  final List<CatalogProduct> featured;
  final List<CatalogCategory> categories;
}

int _variantSort(CatalogVariant a, CatalogVariant b) {
  final sizeCompare = (a.sizeMl ?? 0).compareTo(b.sizeMl ?? 0);
  if (sizeCompare != 0) return sizeCompare;
  final ca = (a.concentration ?? a.concentrationEn ?? a.concentrationAr ?? '')
      .toLowerCase();
  final cb = (b.concentration ?? b.concentrationEn ?? b.concentrationAr ?? '')
      .toLowerCase();
  return ca.compareTo(cb);
}

String? _asString(dynamic value) {
  if (value == null) return null;
  if (value is String) return value;
  return value.toString();
}

double? _asDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int? _asInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

bool? _asBool(dynamic value) {
  if (value == null) return null;
  if (value is bool) return value;
  if (value is String) {
    if (value.toLowerCase() == 'true') return true;
    if (value.toLowerCase() == 'false') return false;
  }
  return null;
}

DateTime? _asDateTime(dynamic value) {
  final text = _asString(value);
  if (text == null || text.isEmpty) return null;
  return DateTime.tryParse(text);
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value == null) return null;
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, val) => MapEntry(key.toString(), val));
  }
  if (value is String) {
    try {
      final decoded = jsonDecode(value);
      return _asMap(decoded);
    } catch (_) {
      return null;
    }
  }
  return null;
}

List<dynamic> _asList(dynamic value) {
  if (value == null) return const <dynamic>[];
  if (value is List) return value;
  if (value is String) {
    try {
      final decoded = jsonDecode(value);
      if (decoded is List) return decoded;
    } catch (_) {
      return const <dynamic>[];
    }
  }
  return const <dynamic>[];
}

List<String> _asStringList(dynamic value) {
  return _asList(
    value,
  ).map((e) => _asString(e)?.trim() ?? '').where((e) => e.isNotEmpty).toList();
}
