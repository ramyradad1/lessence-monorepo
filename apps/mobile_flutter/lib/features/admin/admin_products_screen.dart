import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_colors.dart';
import 'providers/admin_products_provider.dart';
import 'widgets/admin_drawer.dart';
import 'models/admin_product_model.dart';

class AdminProductsScreen extends ConsumerStatefulWidget {
  const AdminProductsScreen({super.key});

  @override
  ConsumerState<AdminProductsScreen> createState() => _AdminProductsScreenState();
}

class _AdminProductsScreenState extends ConsumerState<AdminProductsScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(adminProductsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(adminProductsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Manage Products'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminProductsProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: productsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Error loading products:\n$err',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ),
        data: (products) {
          if (products.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   const Icon(LucideIcons.package, size: 64, color: AppColors.foregroundMuted),
                   const SizedBox(height: 16),
                   const Text(
                    'No products found.',
                     style: TextStyle(color: AppColors.foregroundMuted, fontSize: 16),
                   ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(adminProductsProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: products.length + (productsAsync.isLoading ? 1 : 0),
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                if (index == products.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  );
                }
                final product = products[index];
                return _ProductCard(
                  product: product,
                  onEdit: () => context.push('/admin/products/edit', extra: product.id),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.plus, color: AppColors.background),
        onPressed: () => context.push('/admin/products/edit'),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product, required this.onEdit});

  final AdminProduct product;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final statusColor = product.isActive ? AppColors.success : AppColors.error;
    final statusLabel = product.isActive ? 'ACTIVE' : 'INACTIVE';

    return Container(
      decoration: AppColors.surfaceCard,
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: AppColors.surfaceLighter,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
            image: product.imageUrl != null
                ? DecorationImage(image: NetworkImage(product.imageUrl!), fit: BoxFit.cover)
                : null,
          ),
          child: product.imageUrl == null ? const Icon(LucideIcons.package, color: AppColors.foregroundMuted) : null,
        ),
        title: Text(
          product.nameEn,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.foreground),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4.0),
          child: Row(
            children: [
              Text(
                '${product.price} EGP',
                style: const TextStyle(color: AppColors.foregroundMuted, fontSize: 13),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
              if (product.isNew) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.1),
                    border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'NEW',
                    style: TextStyle(color: AppColors.info, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ],
          ),
        ),
        trailing: const Icon(LucideIcons.chevron_right, color: AppColors.foregroundMuted),
        onTap: onEdit,
      ),
    );
  }
}
