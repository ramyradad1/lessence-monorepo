import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// Provides local persistence.
/// On **web** sqflite is unavailable, so every method falls back to a
/// simple in-memory Map so the rest of the app continues to work without
/// crashing.
class LocalDb {
  static final LocalDb instance = LocalDb._init();
  static Database? _database;

  // ── In-memory fallbacks (web only) ────────────────────────────────
  final Map<String, bool> _memFavorites = {};
  final List<Map<String, dynamic>> _memCart = [];
  final List<Map<String, dynamic>> _memSyncQueue = [];
  int _syncQueueCounter = 0;

  LocalDb._init();

  // ── Database accessor ─────────────────────────────────────────────
  Future<Database?> get database async {
    if (kIsWeb) return null; // sqflite not available on web
    if (_database != null) return _database!;
    _database = await _initDB('app_cache.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE cached_products (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE cached_categories (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE cached_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        data TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE local_favorites (
        product_id TEXT PRIMARY KEY,
        is_favorite INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE local_cart (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0
      )
    ''');
  }

  // ── Categories ────────────────────────────────────────────────────
  Future<void> cacheCategories(List<Map<String, dynamic>> categories) async {
    final db = await instance.database;
    if (db == null) return; // web – skip
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (var i = 0; i < categories.length; i++) {
      final category = categories[i];
      batch.insert(
        'cached_categories',
        {
          'id': category['id'].toString(),
          'data': jsonEncode(category),
          'sort_order': category['sort_order'] ?? i,
          'updated_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Map<String, dynamic>>> getCachedCategories() async {
    final db = await instance.database;
    if (db == null) return const []; // web
    final result = await db.query('cached_categories', orderBy: 'sort_order ASC');
    return result
        .map((e) => jsonDecode(e['data'] as String) as Map<String, dynamic>)
        .toList();
  }

  // ── Products ──────────────────────────────────────────────────────
  Future<void> cacheProducts(List<Map<String, dynamic>> products) async {
    final db = await instance.database;
    if (db == null) return; // web
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (final product in products) {
      batch.insert(
        'cached_products',
        {
          'id': product['id'].toString(),
          'data': jsonEncode(product),
          'updated_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Map<String, dynamic>>> getCachedProducts() async {
    final db = await instance.database;
    if (db == null) return const []; // web
    final result = await db.query('cached_products');
    return result.map((e) => jsonDecode(e['data'] as String) as Map<String, dynamic>).toList();
  }

  // ── Variants ──────────────────────────────────────────────────────
  Future<void> cacheVariants(List<Map<String, dynamic>> variants) async {
    final db = await instance.database;
    if (db == null) return; // web
    final batch = db.batch();

    for (final variant in variants) {
      batch.insert(
        'cached_variants',
        {
          'id': variant['id'].toString(),
          'product_id': variant['product_id'].toString(),
          'data': jsonEncode(variant),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Map<String, dynamic>>> getCachedVariantsByProductId(String productId) async {
    final db = await instance.database;
    if (db == null) return const []; // web
    final result = await db.query(
      'cached_variants',
      where: 'product_id = ?',
      whereArgs: [productId],
    );
    return result.map((e) => jsonDecode(e['data'] as String) as Map<String, dynamic>).toList();
  }

  // ── Favorites ─────────────────────────────────────────────────────
  Future<void> setLocalFavorite(String productId, bool isFavorite) async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      _memFavorites[productId] = isFavorite;
      return;
    }
    await db.insert(
      'local_favorites',
      {
        'product_id': productId,
        'is_favorite': isFavorite ? 1 : 0,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Map<String, bool>> getLocalFavorites() async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      return Map<String, bool>.from(_memFavorites);
    }
    final result = await db.query('local_favorites');
    final map = <String, bool>{};
    for (final row in result) {
      map[row['product_id'] as String] = (row['is_favorite'] as int) == 1;
    }
    return map;
  }

  // ── Cart ──────────────────────────────────────────────────────────
  Future<void> saveLocalCart(List<Map<String, dynamic>> cartItems) async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      _memCart
        ..clear()
        ..addAll(cartItems);
      return;
    }
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    await db.delete('local_cart');

    for (final item in cartItems) {
      final key = [item['product_id'], item['variant_id'] ?? '', item['selected_size'] ?? ''].join('|');
      batch.insert(
        'local_cart',
        {
          'key': key,
          'data': jsonEncode(item),
          'updated_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Map<String, dynamic>>> getLocalCart() async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      return List<Map<String, dynamic>>.from(_memCart);
    }
    final result = await db.query('local_cart');
    return result.map((e) => jsonDecode(e['data'] as String) as Map<String, dynamic>).toList();
  }

  // ── Sync Queue ────────────────────────────────────────────────────
  Future<void> enqueueSyncAction(String action, Map<String, dynamic> payload) async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      _memSyncQueue.add({
        'id': ++_syncQueueCounter,
        'action': action,
        'payload': jsonEncode(payload),
        'created_at': DateTime.now().millisecondsSinceEpoch,
        'retry_count': 0,
      });
      return;
    }
    await db.insert('sync_queue', {
      'action': action,
      'payload': jsonEncode(payload),
      'created_at': DateTime.now().millisecondsSinceEpoch,
      'retry_count': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      return List<Map<String, dynamic>>.from(_memSyncQueue);
    }
    return await db.query('sync_queue', orderBy: 'created_at ASC');
  }

  Future<void> removeSyncAction(int id) async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      _memSyncQueue.removeWhere((e) => e['id'] == id);
      return;
    }
    await db.delete('sync_queue', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> incrementRetryCount(int id) async {
    final db = await instance.database;
    if (db == null) {
      // web: in-memory
      for (final item in _memSyncQueue) {
        if (item['id'] == id) {
          item['retry_count'] = (item['retry_count'] as int) + 1;
          break;
        }
      }
      return;
    }
    await db.rawUpdate('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?', [id]);
  }
}
