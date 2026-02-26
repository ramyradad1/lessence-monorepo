import 'dart:convert';

double _toDouble(dynamic value, [double fallback = 0]) {
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
  if (value is List<dynamic>) return value;
  if (value is String) {
    try {
      final parsed = jsonDecode(value);
      if (parsed is List<dynamic>) return parsed;
    } catch (_) {
      return const [];
    }
  }
  return const [];
}

class AppProfile {
  const AppProfile({
    required this.id,
    required this.email,
    this.fullName,
    this.phone,
    this.avatarUrl,
    this.role,
  });

  final String id;
  final String email;
  final String? fullName;
  final String? phone;
  final String? avatarUrl;
  final String? role;

  factory AppProfile.fromMap(Map<String, dynamic> map) {
    return AppProfile(
      id: map['id'] as String,
      email: (map['email'] ?? '') as String,
      fullName: map['full_name'] as String?,
      phone: map['phone'] as String?,
      avatarUrl: map['avatar_url'] as String?,
      role: map['role'] as String?,
    );
  }
}

class AddressModel {
  const AddressModel({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
    this.phone,
    required this.isDefault,
  });

  final String id;
  final String userId;
  final String fullName;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String postalCode;
  final String country;
  final String? phone;
  final bool isDefault;

  factory AddressModel.fromMap(Map<String, dynamic> map) {
    return AddressModel(
      id: (map['id'] ?? '') as String,
      userId: (map['user_id'] ?? '') as String,
      fullName: (map['full_name'] ?? '') as String,
      addressLine1: (map['address_line1'] ?? '') as String,
      addressLine2: map['address_line2'] as String?,
      city: (map['city'] ?? '') as String,
      state: (map['state'] ?? '') as String,
      postalCode: (map['postal_code'] ?? '') as String,
      country: ((map['country'] ?? 'EG') as String).toUpperCase(),
      phone: map['phone'] as String?,
      isDefault: _toBool(map['is_default']),
    );
  }
}

class AddressDraft {
  const AddressDraft({
    required this.fullName,
    required this.addressLine1,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
    this.addressLine2,
    this.phone,
    this.isDefault = false,
  });

  final String fullName;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String postalCode;
  final String country;
  final String? phone;
  final bool isDefault;

  Map<String, dynamic> toInsertMap(String userId) {
    return <String, dynamic>{
      'user_id': userId,
      'full_name': fullName,
      'address_line1': addressLine1,
      'address_line2': addressLine2?.trim().isEmpty == true
          ? null
          : addressLine2,
      'city': city,
      'state': state,
      'postal_code': postalCode,
      'country': country,
      'phone': phone?.trim().isEmpty == true ? null : phone,
      'is_default': isDefault,
    };
  }

  Map<String, dynamic> toUpdateMap() {
    return <String, dynamic>{
      'full_name': fullName,
      'address_line1': addressLine1,
      'address_line2': addressLine2?.trim().isEmpty == true
          ? null
          : addressLine2,
      'city': city,
      'state': state,
      'postal_code': postalCode,
      'country': country,
      'phone': phone?.trim().isEmpty == true ? null : phone,
      'is_default': isDefault,
    };
  }
}

class ProductSizeOption {
  const ProductSizeOption({required this.size, required this.price});

  final String size;
  final double price;

  factory ProductSizeOption.fromMap(Map<String, dynamic> map) {
    return ProductSizeOption(
      size: (map['size'] ?? '') as String,
      price: _toDouble(map['price']),
    );
  }
}

class ProductVariant {
  const ProductVariant({
    required this.id,
    required this.productId,
    this.sizeMl,
    this.concentration,
    this.concentrationAr,
    required this.price,
    this.isActive = true,
  });

  final String id;
  final String productId;
  final int? sizeMl;
  final String? concentration;
  final String? concentrationAr;
  final double price;
  final bool isActive;

  factory ProductVariant.fromMap(
    Map<String, dynamic> map, {
    double? fallbackBasePrice,
  }) {
    final rawPrice = map['price'];
    final rawAdjustment = map['price_adjustment'];
    final price = rawPrice != null
        ? _toDouble(rawPrice)
        : (fallbackBasePrice ?? 0) + _toDouble(rawAdjustment);

    return ProductVariant(
      id: (map['id'] ?? '') as String,
      productId: (map['product_id'] ?? '') as String,
      sizeMl: map['size_ml'] == null ? null : _toInt(map['size_ml']),
      concentration:
          (map['concentration'] ?? map['concentration_en']) as String?,
      concentrationAr: map['concentration_ar'] as String?,
      price: price,
      isActive: _toBool(map['is_active'], true),
    );
  }

  String label({String localeCode = 'en'}) {
    final parts = <String>[
      if (sizeMl != null) '${sizeMl}ml',
      if (localeCode == 'ar' && (concentrationAr?.isNotEmpty ?? false))
        concentrationAr!
      else if ((concentration?.isNotEmpty ?? false))
        concentration!,
    ];
    return parts.join(' ').trim();
  }
}

class AppProduct {
  const AppProduct({
    required this.id,
    required this.slug,
    required this.name,
    this.nameAr,
    this.subtitle,
    this.subtitleAr,
    this.description,
    this.descriptionAr,
    required this.price,
    this.imageUrl,
    this.isActive = true,
    this.isNew = false,
    this.rating = 0,
    this.reviewCount = 0,
    this.sizeOptions = const [],
    this.variants = const [],
  });

  final String id;
  final String slug;
  final String name;
  final String? nameAr;
  final String? subtitle;
  final String? subtitleAr;
  final String? description;
  final String? descriptionAr;
  final double price;
  final String? imageUrl;
  final bool isActive;
  final bool isNew;
  final double rating;
  final int reviewCount;
  final List<ProductSizeOption> sizeOptions;
  final List<ProductVariant> variants;

  factory AppProduct.fromMap(Map<String, dynamic> map) {
    return AppProduct(
      id: (map['id'] ?? '') as String,
      slug: (map['slug'] ?? '') as String,
      name: ((map['name'] ?? map['name_en']) ?? '') as String,
      nameAr: map['name_ar'] as String?,
      subtitle: (map['subtitle'] ?? map['subtitle_en']) as String?,
      subtitleAr: map['subtitle_ar'] as String?,
      description: (map['description'] ?? map['description_en']) as String?,
      descriptionAr: map['description_ar'] as String?,
      price: _toDouble(map['price'] ?? map['base_price']),
      imageUrl: map['image_url'] as String?,
      isActive: _toBool(map['is_active'], true),
      isNew: _toBool(map['is_new']),
      rating: _toDouble(map['rating']),
      reviewCount: _toInt(map['review_count']),
      sizeOptions: _toList(map['size_options'])
          .whereType<Map>()
          .map((e) => ProductSizeOption.fromMap(Map<String, dynamic>.from(e)))
          .toList(growable: false),
    );
  }

  AppProduct copyWith({List<ProductVariant>? variants}) {
    return AppProduct(
      id: id,
      slug: slug,
      name: name,
      nameAr: nameAr,
      subtitle: subtitle,
      subtitleAr: subtitleAr,
      description: description,
      descriptionAr: descriptionAr,
      price: price,
      imageUrl: imageUrl,
      isActive: isActive,
      isNew: isNew,
      rating: rating,
      reviewCount: reviewCount,
      sizeOptions: sizeOptions,
      variants: variants ?? this.variants,
    );
  }

  String displayName(String localeCode) {
    if (localeCode == 'ar' && (nameAr?.isNotEmpty ?? false)) {
      return nameAr!;
    }
    return name;
  }

  String? displaySubtitle(String localeCode) {
    if (localeCode == 'ar' && (subtitleAr?.isNotEmpty ?? false)) {
      return subtitleAr;
    }
    return subtitle;
  }
}

class CartItemModel {
  const CartItemModel({
    required this.productId,
    required this.quantity,
    required this.productName,
    this.productNameAr,
    this.imageUrl,
    required this.unitPrice,
    this.selectedSize,
    this.variantId,
    this.variantLabel,
  });

  final String productId;
  final int quantity;
  final String productName;
  final String? productNameAr;
  final String? imageUrl;
  final double unitPrice;
  final String? selectedSize;
  final String? variantId;
  final String? variantLabel;

  String get key => [productId, variantId ?? '', selectedSize ?? ''].join('|');

  CartItemModel copyWith({
    int? quantity,
    String? productName,
    String? productNameAr,
    String? imageUrl,
    double? unitPrice,
    String? selectedSize,
    String? variantId,
    String? variantLabel,
  }) {
    return CartItemModel(
      productId: productId,
      quantity: quantity ?? this.quantity,
      productName: productName ?? this.productName,
      productNameAr: productNameAr ?? this.productNameAr,
      imageUrl: imageUrl ?? this.imageUrl,
      unitPrice: unitPrice ?? this.unitPrice,
      selectedSize: selectedSize ?? this.selectedSize,
      variantId: variantId ?? this.variantId,
      variantLabel: variantLabel ?? this.variantLabel,
    );
  }

  String displayName(String localeCode) {
    if (localeCode == 'ar' && (productNameAr?.isNotEmpty ?? false)) {
      return productNameAr!;
    }
    return productName;
  }

  Map<String, dynamic> toLocalJson() {
    return <String, dynamic>{
      'product_id': productId,
      'quantity': quantity,
      'product_name': productName,
      'product_name_ar': productNameAr,
      'image_url': imageUrl,
      'unit_price': unitPrice,
      'selected_size': selectedSize,
      'variant_id': variantId,
      'variant_label': variantLabel,
    };
  }

  factory CartItemModel.fromLocalJson(Map<String, dynamic> map) {
    return CartItemModel(
      productId: (map['product_id'] ?? '') as String,
      quantity: _toInt(map['quantity'], 1),
      productName: (map['product_name'] ?? '') as String,
      productNameAr: map['product_name_ar'] as String?,
      imageUrl: map['image_url'] as String?,
      unitPrice: _toDouble(map['unit_price']),
      selectedSize: map['selected_size'] as String?,
      variantId: map['variant_id'] as String?,
      variantLabel: map['variant_label'] as String?,
    );
  }
}

class AppOrder {
  const AppOrder({
    required this.id,
    required this.orderNumber,
    required this.userId,
    required this.status,
    required this.subtotal,
    required this.discountAmount,
    required this.shippingFee,
    required this.totalAmount,
    required this.shippingAddress,
    required this.createdAt,
    this.items = const [],
  });

  final String id;
  final String orderNumber;
  final String userId;
  final String status;
  final double subtotal;
  final double discountAmount;
  final double shippingFee;
  final double totalAmount;
  final Map<String, dynamic> shippingAddress;
  final DateTime createdAt;
  final List<AppOrderItem> items;

  AppOrder copyWith({List<AppOrderItem>? items}) {
    return AppOrder(
      id: id,
      orderNumber: orderNumber,
      userId: userId,
      status: status,
      subtotal: subtotal,
      discountAmount: discountAmount,
      shippingFee: shippingFee,
      totalAmount: totalAmount,
      shippingAddress: shippingAddress,
      createdAt: createdAt,
      items: items ?? this.items,
    );
  }

  factory AppOrder.fromJson(Map<String, dynamic> map) {
    return AppOrder(
      id: map['id'] as String,
      orderNumber: map['order_number'] as String,
      userId: map['user_id'] as String,
      status: map['status'] as String,
      subtotal: _toDouble(map['subtotal']),
      discountAmount: _toDouble(map['discount_amount']),
      shippingFee: _toDouble(map['shipping_fee']),
      totalAmount: _toDouble(map['total_amount']),
      shippingAddress: map['shipping_address'] as Map<String, dynamic>? ?? {},
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }
}

class AppOrderItem {
  const AppOrderItem({
    required this.id,
    required this.orderId,
    required this.productId,
    required this.variantId,
    required this.productName,
    required this.price,
    required this.quantity,
  });

  final String id;
  final String orderId;
  final String productId;
  final String? variantId;
  final String productName;
  final double price;
  final int quantity;

  factory AppOrderItem.fromJson(Map<String, dynamic> map) {
    return AppOrderItem(
      id: map['id'] as String,
      orderId: map['order_id'] as String,
      productId: map['product_id'] as String,
      variantId: map['variant_id'] as String?,
      productName: map['product_name'] as String,
      price: _toDouble(map['price']),
      quantity: _toInt(map['quantity'], 1),
    );
  }
}

class AppReview {
  const AppReview({
    required this.id,
    required this.productId,
    this.userId,
    this.userFullName,
    required this.rating,
    this.comment,
    required this.isApproved,
    required this.createdAt,
  });

  final String id;
  final String productId;
  final String? userId;
  final String? userFullName;
  final int rating;
  final String? comment;
  final bool isApproved;
  final DateTime createdAt;

  factory AppReview.fromJson(Map<String, dynamic> map) {
    String? fullName;
    if (map['profiles'] != null && map['profiles'] is Map) {
      fullName = map['profiles']['full_name'] as String?;
    } else if (map['user_full_name'] != null) {
      fullName = map['user_full_name'] as String?;
    }

    return AppReview(
      id: map['id'] as String,
      productId: map['product_id'] as String,
      userId: map['user_id'] as String?,
      userFullName: fullName,
      rating: _toInt(map['rating'], 5),
      comment: map['comment'] as String?,
      isApproved: map['is_approved'] as bool? ?? false,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }
}
