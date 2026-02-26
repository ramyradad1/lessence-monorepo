class AdminSetting {
  final String key;
  final Map<String, dynamic> value;

  const AdminSetting({
    required this.key,
    required this.value,
  });

  factory AdminSetting.fromMap(Map<String, dynamic> map) {
    return AdminSetting(
      key: map['key'] as String,
      value: map['value'] as Map<String, dynamic>,
    );
  }
}
