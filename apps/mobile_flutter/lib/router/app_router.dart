import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/home/home_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/catalog/catalog_screen.dart';
import '../features/catalog/product_detail_screen.dart';
import '../features/checkout/checkout_screen.dart';
import '../features/orders/orders_screen.dart';
import '../features/admin/admin_dashboard_screen.dart';
import '../features/admin/admin_products_screen.dart';
import '../features/admin/admin_orders_screen.dart';
import '../features/admin/admin_reports_screen.dart';
import '../features/admin/admin_placeholder_screen.dart';
import '../features/admin/admin_categories_screen.dart';
import '../features/admin/admin_brands_screen.dart';
import '../features/admin/admin_collections_screen.dart';
import '../features/admin/admin_bundles_screen.dart';
import '../features/admin/admin_coupons_screen.dart';
import '../features/admin/admin_reviews_screen.dart';
import '../features/admin/admin_users_screen.dart';
import '../features/admin/admin_settings_screen.dart';
import '../features/admin/admin_product_form_screen.dart';
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
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/products',
        builder: (context, state) => const AdminProductsScreen(),
      ),
      GoRoute(
        path: '/admin/products/edit',
        builder: (context, state) =>
            AdminProductFormScreen(productId: state.extra as String?),
      ),
      GoRoute(
        path: '/admin/orders',
        builder: (context, state) => const AdminOrdersScreen(),
      ),
      GoRoute(
        path: '/admin/categories',
        builder: (context, state) => const AdminCategoriesScreen(),
      ),
      GoRoute(
        path: '/admin/brands',
        builder: (context, state) => const AdminBrandsScreen(),
      ),
      GoRoute(
        path: '/admin/collections',
        builder: (context, state) => const AdminCollectionsScreen(),
      ),
      GoRoute(
        path: '/admin/bundles',
        builder: (context, state) => const AdminBundlesScreen(),
      ),
      GoRoute(
        path: '/admin/reports',
        builder: (context, state) => const AdminReportsScreen(),
      ),
      GoRoute(
        path: '/admin/coupons',
        builder: (context, state) => const AdminCouponsScreen(),
      ),
      GoRoute(
        path: '/admin/reviews',
        builder: (context, state) => const AdminReviewsScreen(),
      ),
      GoRoute(
        path: '/admin/customers',
        builder: (context, state) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/settings',
        builder: (context, state) => const AdminSettingsScreen(),
      ),
      GoRoute(
        path: '/admin/policies',
        builder: (context, state) =>
            const AdminPlaceholderScreen(title: 'Policies'),
      ),
    ],
  );
});
