import 'dart:async';

/// Mixin to provide request deduplication for futures.
/// Prevents identical in-flight requests from executing multiple times concurrently.
mixin DeduplicatorMixin {
  final Map<String, Future<dynamic>> _inFlightRequests = {};

  /// Wraps a future operation with deduplication logic based on a unique [key].
  Future<T> deduplicate<T>(String key, Future<T> Function() operation) async {
    if (_inFlightRequests.containsKey(key)) {
      return _inFlightRequests[key] as Future<T>;
    }

    final future = operation();
    _inFlightRequests[key] = future;

    try {
      final result = await future;
      return result;
    } finally {
      // Small delay to ensure immediate subsequent calls catch the cached result if applicable
      // or to just clear the inflight map properly after completion.
      Future.delayed(Duration.zero, () {
        _inFlightRequests.remove(key);
      });
    }
  }
}
