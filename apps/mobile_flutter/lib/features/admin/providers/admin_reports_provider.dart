import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/repositories/analytics_repository.dart';

final adminReportsProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, period) async {
  final repository = ref.read(analyticsRepositoryProvider);
  return repository.getDetailedMetrics(period: period);
});

class SelectedReportPeriod extends Notifier<String> {
  @override
  String build() => '30d';
  
  void setPeriod(String p) {
    state = p;
  }
}

final selectedReportPeriodProvider = NotifierProvider<SelectedReportPeriod, String>(SelectedReportPeriod.new);

final currentAdminReportsProvider = FutureProvider<Map<String, dynamic>>((ref) {
  final period = ref.watch(selectedReportPeriodProvider);
  return ref.watch(adminReportsProvider(period).future);
});
