import 'dart:convert';

/// Represents a product in the admin context, mapping to the `products` table.
class AdminProduct {
  const AdminProduct({
    required this.id,
    this.categoryId,
    required this.slug,
    this.sku,
    required this.nameEn,
    required this.nameAr,
    this.subtitleEn,
    this.subtitleAr,
    this.descriptionEn,
    this.descriptionAr,
    required this.price,
    this.imageUrl,
    this.images = const [],
    this.isActive = true,
    this.isNew = false,
    this.genderTarget,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.lowStockThreshold = 5,
    this.scentProfiles = const [],
    this.sizeOptions = const [],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? categoryId;
  final String slug;
  final String? sku;
  final String nameEn;
  final String nameAr;
  final String? subtitleEn;
  final String? subtitleAr;
  final String? descriptionEn;
  final String? descriptionAr;
  final double price;
  final String? imageUrl;
  final List<dynamic> images;
  final bool isActive;
  final bool isNew;
  final String? genderTarget;
  final double rating;
  final int reviewCount;
  final int lowStockThreshold;
  final List<dynamic> scentProfiles;
  final List<dynamic> sizeOptions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory AdminProduct.fromMap(Map<String, dynamic> map) {
    return AdminProduct(
      id: map['id'] as String,
      categoryId: map['category_id'] as String?,
      slug: map['slug'] as String? ?? '',
      sku: map['sku'] as String?,
      nameEn: map['name_en'] as String? ?? map['name'] as String? ?? '',
      nameAr: map['name_ar'] as String? ?? '',
      subtitleEn: map['subtitle_en'] as String?,
      subtitleAr: map['subtitle_ar'] as String?,
      descriptionEn: map['description_en'] as String?,
      descriptionAr: map['description_ar'] as String?,
      price: _toDouble(map['price']),
      imageUrl: map['image_url'] as String?,
      images: _toList(map['images']),
      isActive: _toBool(map['is_active'], true),
      isNew: _toBool(map['is_new']),
      genderTarget: map['gender_target'] as String?,
      rating: _toDouble(map['rating']),
      reviewCount: _toInt(map['review_count']),
      lowStockThreshold: _toInt(map['low_stock_threshold'], 5),
      scentProfiles: _toList(map['scent_profiles']),
      sizeOptions: _toList(map['size_options']),
      createdAt: map['created_at'] != null ? DateTime.tryParse(map['created_at']) : null,
      updatedAt: map['updated_at'] != null ? DateTime.tryParse(map['updated_at']) : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'category_id': categoryId,
      'slug': slug,
      'sku': sku,
      'name': nameEn, // 'name' column is required in DB
      'name_en': nameEn,
      'name_ar': nameAr,
      'subtitle': subtitleEn,
      'subtitle_en': subtitleEn,
      'subtitle_ar': subtitleAr,
      'description': descriptionEn,
      'description_en': descriptionEn,
      'description_ar': descriptionAr,
      'price': price,
      'image_url': imageUrl,
      'images': images,
      'is_active': isActive,
      'is_new': isNew,
      'gender_target': genderTarget,
      'scent_profiles': scentProfiles,
      'size_options': sizeOptions,
      'low_stock_threshold': lowStockThreshold,
    };
  }
}

/// Represents a variant for a product mapping to `product_variants`
class AdminProductVariant {
  const AdminProductVariant({
    required this.id,
    required this.productId,
    this.sku,
    required this.sizeMl,
    this.concentration,
    required this.price,
    required this.stockQty,
    this.lowStockThreshold = 5,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String productId;
  final String? sku;
  final int sizeMl;
  final String? concentration;
  final double price;
  final int stockQty;
  final int lowStockThreshold;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory AdminProductVariant.fromMap(Map<String, dynamic> map) {
    return AdminProductVariant(
      id: map['id'] as String,
      productId: map['product_id'] as String,
      sku: map['sku'] as String?,
      sizeMl: _toInt(map['size_ml']),
      concentration: map['concentration'] as String?,
      price: _toDouble(map['price']),
      stockQty: _toInt(map['stock_qty']),
      lowStockThreshold: _toInt(map['low_stock_threshold'], 5),
      isActive: _toBool(map['is_active'], true),
      createdAt: map['created_at'] != null ? DateTime.tryParse(map['created_at']) : null,
      updatedAt: map['updated_at'] != null ? DateTime.tryParse(map['updated_at']) : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'product_id': productId,
      'sku': sku,
      'size_ml': sizeMl,
      'concentration': concentration,
      'price': price,
      'stock_qty': stockQty,
      'low_stock_threshold': lowStockThreshold,
      'is_active': isActive,
    };
  }
}

/// Represents images tied to a product mapping to `product_images`
/// Note: product_images table does not exist yet in the database.
class AdminProductImage {
  const AdminProductImage({
    required this.id,
    required this.productId,
    this.variantId,
    required this.imageUrl,
    this.altTextEn,
    this.altTextAr,
    this.sortOrder = 0,
    this.isPrimary = false,
  });

  final String id;
  final String productId;
  final String? variantId;
  final String imageUrl;
  final String? altTextEn;
  final String? altTextAr;
  final int sortOrder;
  final bool isPrimary;

  factory AdminProductImage.fromMap(Map<String, dynamic> map) {
    return AdminProductImage(
      id: map['id'] as String,
      productId: map['product_id'] as String,
      variantId: map['variant_id'] as String?,
      imageUrl: map['image_url'] as String,
      altTextEn: map['alt_text_en'] as String?,
      altTextAr: map['alt_text_ar'] as String?,
      sortOrder: _toInt(map['sort_order']),
      isPrimary: _toBool(map['is_primary']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'product_id': productId,
      'variant_id': variantId,
      'image_url': imageUrl,
      'alt_text_en': altTextEn,
      'alt_text_ar': altTextAr,
      'sort_order': sortOrder,
      'is_primary': isPrimary,
    };
  }
}

// Helpers
double _toDouble(dynamic value, [double fallback = 0.0]) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

int _toInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

bool _toBool(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true';
  return fallback;
}

List<dynamic> _toList(dynamic value) {
  if (value is List) return value;
  if (value is String) {
    try {
      final decoded = jsonDecode(value);
      if (decoded is List) return decoded;
    } catch (_) {}
  }
  return const [];
}
