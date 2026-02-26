class AdminReview {
  final String id;
  final String productId;
  final String userId;
  final int rating;
  final String? comment;
  final bool isApproved;
  final bool isVerifiedPurchase;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Joined fields
  final String? userName;
  final String? userEmail;
  final String? productNameEn;
  final String? productNameAr;

  const AdminReview({
    required this.id,
    required this.productId,
    required this.userId,
    required this.rating,
    this.comment,
    required this.isApproved,
    this.isVerifiedPurchase = false,
    required this.createdAt,
    required this.updatedAt,
    this.userName,
    this.userEmail,
    this.productNameEn,
    this.productNameAr,
  });

  factory AdminReview.fromMap(Map<String, dynamic> map) {
    String? userName;
    String? userEmail;
    // Support both 'profiles' and 'user_profiles' keys for flexibility
    final profileData = map['profiles'] ?? map['user_profiles'];
    if (profileData != null && profileData is Map) {
      userName = profileData['full_name'] as String?;
      userEmail = profileData['email'] as String?;
    }

    String? productNameEn;
    String? productNameAr;
    if (map['products'] != null && map['products'] is Map) {
      productNameEn = map['products']['name_en'] as String?;
      productNameAr = map['products']['name_ar'] as String?;
    }

    return AdminReview(
      id: map['id'] as String,
      productId: map['product_id'] as String,
      userId: map['user_id'] as String,
      rating: map['rating'] as int,
      comment: map['comment'] as String?,
      isApproved: map['is_approved'] as bool? ?? false,
      isVerifiedPurchase: map['is_verified_purchase'] as bool? ?? false,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      userName: userName,
      userEmail: userEmail,
      productNameEn: productNameEn,
      productNameAr: productNameAr,
    );
  }
}
