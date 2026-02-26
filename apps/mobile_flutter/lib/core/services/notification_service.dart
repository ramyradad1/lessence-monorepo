import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

class NotificationService {
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  RealtimeChannel? _notificationChannel;

  Future<void> initialize() async {
    // 1. Configure Local Notifications for foreground iOS-style banners on Android
    const AndroidInitializationSettings initSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings initSettingsIOS = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const InitializationSettings initSettings = InitializationSettings(
      android: initSettingsAndroid,
      iOS: initSettingsIOS,
    );

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tapped logic here
        debugPrint("Notification tapped: ${response.payload}");
      },
    );

    // Create a high importance channel for Android to show heads-up (banner) notifications
    if (defaultTargetPlatform == TargetPlatform.android) {
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'high_importance_channel', // id
        'High Importance Notifications', // title
        description: 'This channel is used for important notifications.',
        importance: Importance.max,
      );
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }

    // 2. Listen to Authentication State changes
    // If a user logs in, subscribe to their notifications. If they log out, unsubscribe.
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null) {
        _subscribeToNotifications(session.user.id);
      } else {
        _unsubscribeFromNotifications();
      }
    });

    // 3. Initial check just in case we are already logged in when this service starts
    final currentUser = Supabase.instance.client.auth.currentUser;
    if (currentUser != null) {
      _subscribeToNotifications(currentUser.id);
    }
  }

  void _subscribeToNotifications(String userId) {
    if (_notificationChannel != null) {
      _unsubscribeFromNotifications();
    }

    debugPrint("Subscribing to realtime notifications for user $userId");

    _notificationChannel = Supabase.instance.client
        .channel('public:notifications:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) {
            debugPrint('New notification received via Supabase Realtime: $payload');
            _showLocalNotification(payload.newRecord);
          },
        )
        .subscribe();
  }

  void _unsubscribeFromNotifications() {
    if (_notificationChannel != null) {
      debugPrint("Unsubscribing from realtime notifications");
      Supabase.instance.client.removeChannel(_notificationChannel!);
      _notificationChannel = null;
    }
  }

  void _showLocalNotification(Map<String, dynamic> record) {
    final title = record['title']?.toString() ?? 'New Notification';
    final body = record['body']?.toString() ?? '';
    final id = record['id']?.hashCode ?? DateTime.now().millisecondsSinceEpoch;

    _localNotifications.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          channelDescription: 'This channel is used for important notifications.',
          icon: '@mipmap/ic_launcher',
          importance: Importance.max,
          priority: Priority.max,
          // Use this to style it somewhat like iOS banner
          color: Color(0xFF000000), 
          ticker: 'ticker',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: record['data']?.toString(),
    );
  }
}
