import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import '../../../theme/app_colors.dart';
import 'widgets/admin_drawer.dart';

class AdminPlaceholderScreen extends StatelessWidget {
  const AdminPlaceholderScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        centerTitle: true,
      ),
      drawer: const AdminDrawer(),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surfaceLighter,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.hammer,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              '$title Module',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.foreground,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              'This module is currently under construction.\nPlease check back later.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.foregroundMuted,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
