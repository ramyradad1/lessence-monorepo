class AdminBundle {
  final String id;
  final String nameEn;
  final String nameAr;
  final String descriptionEn;
  final String descriptionAr;
  final double price;
  final String? imageUrl;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AdminBundle({
    required this.id,
    required this.nameEn,
    required this.nameAr,
    required this.descriptionEn,
    required this.descriptionAr,
    required this.price,
    this.imageUrl,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AdminBundle.fromMap(Map<String, dynamic> map) {
    return AdminBundle(
      id: map['id'] as String? ?? '',
      nameEn: map['name_en'] as String? ?? map['name'] as String? ?? '',
      nameAr: map['name_ar'] as String? ?? '',
      descriptionEn: map['description_en'] as String? ?? map['description'] as String? ?? '',
      descriptionAr: map['description_ar'] as String? ?? '',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      imageUrl: map['image_url'] as String?,
      isActive: map['is_active'] as bool? ?? true,
      createdAt: map['created_at'] != null ? DateTime.tryParse(map['created_at'].toString()) ?? DateTime.now() : DateTime.now(),
      updatedAt: map['updated_at'] != null ? DateTime.tryParse(map['updated_at'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name_en': nameEn,
      'name_ar': nameAr,
      'description_en': descriptionEn,
      'description_ar': descriptionAr,
      'price': price,
      'image_url': imageUrl,
      'is_active': isActive,
    };
  }
}
