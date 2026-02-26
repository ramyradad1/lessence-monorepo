import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../data/repositories/analytics_repository.dart';

final adminDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final supabase = ref.watch(supabaseClientProvider);
  
  // Verify admin role explicitly
  final userResult = await supabase.from('profiles').select('role').eq('id', supabase.auth.currentUser!.id).maybeSingle();
  if (userResult == null || (userResult['role'] != 'admin' && userResult['role'] != 'super_admin')) {
    throw Exception('Unauthorized');
  }

  // Fetch metrics using repository
  final repository = ref.read(analyticsRepositoryProvider);
  final metrics = await repository.getDashboardMetrics();
  
  return {
    'totalUsers': metrics['total_users'] ?? 0,
    'totalProducts': metrics['total_products'] ?? 0,
    'totalOrders': metrics['total_orders'] ?? 0,
    'totalRevenue': metrics['total_revenue'] ?? 0.0,
  };
});
