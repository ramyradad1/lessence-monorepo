import 'dart:convert';

enum OrderStatus {
  pending,
  paid,
  processing,
  shipped,
  delivered,
  cancelled,
  refunded;

  String get displayName {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.paid:
        return 'Paid';
      case OrderStatus.processing:
        return 'Processing';
      case OrderStatus.shipped:
        return 'Shipped';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.refunded:
        return 'Refunded';
    }
  }

  static OrderStatus fromString(String value) {
    return OrderStatus.values.firstWhere(
      (e) => e.name.toLowerCase() == value.toLowerCase(),
      orElse: () => OrderStatus.pending,
    );
  }
}

class AdminOrder {
  const AdminOrder({
    required this.id,
    required this.orderNumber,
    this.userId,
    required this.status,
    required this.subtotal,
    this.discountAmount = 0.0,
    required this.totalAmount,
    this.shippingAddressId,
    this.isGift = false,
    this.giftWrap = false,
    this.giftMessage,
    required this.createdAt,
    required this.updatedAt,
    this.items = const <AdminOrderItem>[],
    this.customerName,
    this.customerEmail,
  });

  final String id;
  final String orderNumber;
  final String? userId;
  final OrderStatus status;
  final double subtotal;
  final double discountAmount;
  final double totalAmount;
  final String? shippingAddressId;
  final bool isGift;
  final bool giftWrap;
  final String? giftMessage;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<AdminOrderItem> items;
  
  // Joined fields from profiles table
  final String? customerName;
  final String? customerEmail;

  factory AdminOrder.fromMap(Map<String, dynamic> map) {
    // Parse items
    List<AdminOrderItem> parsedItems = [];
    if (map['order_items'] != null && map['order_items'] is List) {
      parsedItems = (map['order_items'] as List)
          .map((e) => AdminOrderItem.fromMap(_asMap(e) ?? {}))
          .toList();
    } else if (map['items'] != null && map['items'] is List) {
      parsedItems = (map['items'] as List)
          .map((e) => AdminOrderItem.fromMap(_asMap(e) ?? {}))
          .toList();
    }

    // Parse profile join — support both 'profiles' and 'user_profiles' keys
    String? name;
    String? email;
    final profileData = map['profiles'] ?? map['user_profiles'];
    if (profileData != null && profileData is Map) {
      name = _asString(profileData['full_name']);
      email = _asString(profileData['email']);
    }

    return AdminOrder(
      id: _asString(map['id']) ?? '',
      orderNumber: _asString(map['order_number']) ?? '',
      userId: _asString(map['user_id']),
      status: OrderStatus.fromString(_asString(map['status']) ?? 'pending'),
      subtotal: _asDouble(map['subtotal']) ?? 0.0,
      discountAmount: _asDouble(map['discount_amount']) ?? 0.0,
      totalAmount: _asDouble(map['total_amount']) ?? 0.0,
      shippingAddressId: _asString(map['shipping_address_id']),
      isGift: map['is_gift'] as bool? ?? false,
      giftWrap: map['gift_wrap'] as bool? ?? false,
      giftMessage: _asString(map['gift_message']),
      createdAt: _asDateTime(map['created_at']) ?? DateTime.now(),
      updatedAt: _asDateTime(map['updated_at']) ?? DateTime.now(),
      items: parsedItems,
      customerName: name,
      customerEmail: email,
    );
  }

  AdminOrder copyWith({
    String? id,
    String? orderNumber,
    String? userId,
    OrderStatus? status,
    double? subtotal,
    double? discountAmount,
    double? totalAmount,
    String? shippingAddressId,
    bool? isGift,
    bool? giftWrap,
    String? giftMessage,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<AdminOrderItem>? items,
    String? customerName,
    String? customerEmail,
  }) {
    return AdminOrder(
      id: id ?? this.id,
      orderNumber: orderNumber ?? this.orderNumber,
      userId: userId ?? this.userId,
      status: status ?? this.status,
      subtotal: subtotal ?? this.subtotal,
      discountAmount: discountAmount ?? this.discountAmount,
      totalAmount: totalAmount ?? this.totalAmount,
      shippingAddressId: shippingAddressId ?? this.shippingAddressId,
      isGift: isGift ?? this.isGift,
      giftWrap: giftWrap ?? this.giftWrap,
      giftMessage: giftMessage ?? this.giftMessage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      items: items ?? this.items,
      customerName: customerName ?? this.customerName,
      customerEmail: customerEmail ?? this.customerEmail,
    );
  }
}

class AdminOrderItem {
  const AdminOrderItem({
    required this.id,
    required this.orderId,
    this.productId,
    this.variantId,
    this.bundleId,
    required this.productName,
    this.bundleName,
    this.selectedSize,
    required this.price,
    required this.quantity,
    required this.createdAt,
  });

  final String id;
  final String orderId;
  final String? productId;
  final String? variantId;
  final String? bundleId;
  final String productName;
  final String? bundleName;
  final String? selectedSize;
  final double price;
  final int quantity;
  final DateTime createdAt;

  factory AdminOrderItem.fromMap(Map<String, dynamic> map) {
    return AdminOrderItem(
      id: _asString(map['id']) ?? '',
      orderId: _asString(map['order_id']) ?? '',
      productId: _asString(map['product_id']),
      variantId: _asString(map['variant_id']),
      bundleId: _asString(map['bundle_id']),
      productName: _asString(map['product_name']) ?? '',
      bundleName: _asString(map['bundle_name']),
      selectedSize: _asString(map['selected_size']),
      price: _asDouble(map['price']) ?? 0.0,
      quantity: _asInt(map['quantity']) ?? 1,
      createdAt: _asDateTime(map['created_at']) ?? DateTime.now(),
    );
  }
}


// Utility parsers
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
