import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/home/home_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/catalog/catalog_screen.dart';
import '../features/catalog/product_detail_screen.dart';
import '../core/providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(sessionProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = session != null;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (!isLoggedIn && !isGoingToLogin) {
        return '/login';
      }
      if (isLoggedIn && isGoingToLogin) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(
        path: '/catalog',
        builder: (context, state) => CatalogScreen(
          initialCategorySlug: state.uri.queryParameters['category'],
        ),
      ),
      GoRoute(
        path: '/product/:slugOrId',
        builder: (context, state) => ProductDetailScreen(
          slugOrId: Uri.decodeComponent(state.pathParameters['slugOrId'] ?? ''),
        ),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    ],
  );
});
