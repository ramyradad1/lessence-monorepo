import 'dart:developer' as developer;

import 'package:supabase_flutter/supabase_flutter.dart';

/// Extension to log Supabase queries for performance analysis
extension SupabaseQueryLogger on PostgrestFilterBuilder {
  /// Executes the query and logs the execution time
  Future<List<Map<String, dynamic>>> executeAndLog(String contextName) async {
    final startTime = DateTime.now();
    try {
      // Execute the actual query
      final response = await this;
      
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] Context: $contextName | Duration: ${duration.inMilliseconds}ms | Status: SUCCESS');
      
      return (response as List<dynamic>).whereType<Map<String, dynamic>>().toList(growable: false);
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] ERROR Context: $contextName | Duration: ${duration.inMilliseconds}ms | Error: $e');
      rethrow;
    }
  }
}

extension SupabaseTransformLogger on PostgrestTransformBuilder {
  Future<List<Map<String, dynamic>>> executeAndLog(String contextName) async {
    final startTime = DateTime.now();
    try {
      final response = await this;
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] Context: $contextName | Duration: ${duration.inMilliseconds}ms | Status: SUCCESS');
      return (response as List<dynamic>).whereType<Map<String, dynamic>>().toList(growable: false);
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] ERROR Context: $contextName | Duration: ${duration.inMilliseconds}ms | Error: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>?> executeMaybeSingleAndLog(String contextName) async {
    final startTime = DateTime.now();
    try {
      final response = await maybeSingle();
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] Context: $contextName | Duration: ${duration.inMilliseconds}ms | Status: SUCCESS');
      return response;
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] ERROR Context: $contextName | Duration: ${duration.inMilliseconds}ms | Error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> executeSingleAndLog(String contextName) async {
    final startTime = DateTime.now();
    try {
      final response = await single();
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] Context: $contextName | Duration: ${duration.inMilliseconds}ms | Status: SUCCESS');
      return response;
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      developer.log('[FETCH_LOGGER] ERROR Context: $contextName | Duration: ${duration.inMilliseconds}ms | Error: $e');
      rethrow;
    }
  }
}
