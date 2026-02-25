// This is a basic Flutter widget test.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile_flutter/core/providers/shared_preferences_provider.dart';
import 'package:mobile_flutter/router/app_router.dart';
import 'package:mobile_flutter/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final testRouter = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const Scaffold(
            body: Center(child: Text('Smoke test')),
          ),
        ),
      ],
    );

    // Build our app and trigger a frame.
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          routerProvider.overrideWithValue(testRouter),
        ],
        child: const LApp(),
      ),
    );
    await tester.pumpAndSettle();

    // Verify that the app can render with injected dependencies.
    expect(find.text('Smoke test'), findsOneWidget);
  });
}
