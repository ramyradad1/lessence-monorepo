class AdminCollection {
  final String id;
  final String slug;
  final String nameEn;
  final String nameAr;
  final String? descriptionEn;
  final String? descriptionAr;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AdminCollection({
    required this.id,
    required this.slug,
    required this.nameEn,
    required this.nameAr,
    this.descriptionEn,
    this.descriptionAr,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AdminCollection.fromMap(Map<String, dynamic> map) {
    return AdminCollection(
      id: map['id'] as String,
      slug: map['slug'] as String,
      nameEn: map['name_en'] as String,
      nameAr: map['name_ar'] as String,
      descriptionEn: map['description_en'] as String?,
      descriptionAr: map['description_ar'] as String?,
      isActive: map['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'slug': slug,
      'name_en': nameEn,
      'name_ar': nameAr,
      'description_en': descriptionEn,
      'description_ar': descriptionAr,
      'is_active': isActive,
    };
  }
}
