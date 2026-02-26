
/// A simple generic in-memory cache manager with TTL support.
class CacheManager<T> {
  final Duration ttl;
  final Map<String, _CacheEntry<T>> _cache = {};

  CacheManager({this.ttl = const Duration(minutes: 5)});

  /// Gets an item from the cache if it exists and has not expired.
  T? get(String key) {
    final entry = _cache[key];
    if (entry == null) return null;

    if (DateTime.now().isAfter(entry.expiry)) {
      _cache.remove(key);
      return null;
    }

    return entry.value;
  }

  /// Sets an item in the cache with the configured TTL.
  void set(String key, T value) {
    _cache[key] = _CacheEntry(
      value: value,
      expiry: DateTime.now().add(ttl),
    );
  }

  /// Removes an item from the cache.
  void remove(String key) {
    _cache.remove(key);
  }

  /// Clears the entire cache.
  void clear() {
    _cache.clear();
  }
}

class _CacheEntry<T> {
  final T value;
  final DateTime expiry;

  _CacheEntry({required this.value, required this.expiry});
}
