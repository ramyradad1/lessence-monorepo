class AdminBrand {
  final String id;
  final String nameEn;
  final String nameAr;
  final String? descriptionEn;
  final String? descriptionAr;
  final String? logoUrl;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AdminBrand({
    required this.id,
    required this.nameEn,
    required this.nameAr,
    this.descriptionEn,
    this.descriptionAr,
    this.logoUrl,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AdminBrand.fromMap(Map<String, dynamic> map) {
    return AdminBrand(
      id: map['id'] as String,
      nameEn: map['name_en'] as String,
      nameAr: map['name_ar'] as String,
      descriptionEn: map['description_en'] as String?,
      descriptionAr: map['description_ar'] as String?,
      logoUrl: map['logo_url'] as String?,
      isActive: map['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'name_en': nameEn,
      'name_ar': nameAr,
      'description_en': descriptionEn,
      'description_ar': descriptionAr,
      'logo_url': logoUrl,
      'is_active': isActive,
    };
  }
}
