class AdminCoupon {
  final String id;
  final String code;
  final String discountType;
  final double discountAmount;
  final double minOrderAmount;
  final int? usageLimit;
  final int? perUserLimit;
  final int timesUsed;
  final DateTime? validFrom;
  final DateTime? validUntil;
  final bool isActive;
  final bool firstOrderOnly;
  final DateTime createdAt;

  const AdminCoupon({
    required this.id,
    required this.code,
    required this.discountType,
    required this.discountAmount,
    this.minOrderAmount = 0,
    this.usageLimit,
    this.perUserLimit,
    this.timesUsed = 0,
    this.validFrom,
    this.validUntil,
    this.isActive = true,
    this.firstOrderOnly = false,
    required this.createdAt,
  });

  factory AdminCoupon.fromMap(Map<String, dynamic> map) {
    return AdminCoupon(
      id: map['id'] as String,
      code: map['code'] as String,
      discountType: map['discount_type'] as String,
      discountAmount: double.parse(map['discount_amount'].toString()),
      minOrderAmount: map['min_order_amount'] != null ? double.parse(map['min_order_amount'].toString()) : 0,
      usageLimit: map['usage_limit'] as int?,
      perUserLimit: map['per_user_limit'] as int?,
      timesUsed: map['times_used'] as int? ?? 0,
      validFrom: map['valid_from'] != null ? DateTime.parse(map['valid_from'] as String) : null,
      validUntil: map['valid_until'] != null ? DateTime.parse(map['valid_until'] as String) : null,
      isActive: map['is_active'] as bool? ?? true,
      firstOrderOnly: map['first_order_only'] as bool? ?? false,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'code': code,
      'discount_type': discountType,
      'discount_amount': discountAmount,
      'min_order_amount': minOrderAmount,
      'usage_limit': usageLimit,
      'per_user_limit': perUserLimit,
      'valid_from': validFrom?.toIso8601String(),
      'valid_until': validUntil?.toIso8601String(),
      'is_active': isActive,
      'first_order_only': firstOrderOnly,
    };
  }
}
