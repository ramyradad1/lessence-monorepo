import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/app_colors.dart';
import 'models/admin_brand_model.dart';
import 'providers/admin_brands_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminBrandsScreen extends ConsumerWidget {
  const AdminBrandsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminBrandsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Brands Management'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminBrandsProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: state.when(
        data: (brands) {
          if (brands.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.stamp,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No brands found',
                    style: TextStyle(
                      color: AppColors.foregroundMuted,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(adminBrandsProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: brands.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final brand = brands[index];
                return _BrandCard(
                  brand: brand,
                  onEdit: () => _showBrandForm(context, ref, brand),
                  onDelete: () => _confirmDelete(context, ref, brand),
                );
              },
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (err, st) => Center(
          child: Text(
            'Error loading brands:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.plus, color: AppColors.background),
        onPressed: () => _showBrandForm(context, ref, null),
      ),
    );
  }

  void _showBrandForm(BuildContext context, WidgetRef ref, AdminBrand? brand) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _BrandFormSheet(brand: brand),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, AdminBrand brand) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Brand?', style: TextStyle(color: AppColors.foreground)),
        content: Text(
          'Are you sure you want to delete "${brand.nameEn}"? This action cannot be undone.',
          style: const TextStyle(color: AppColors.foregroundMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.foregroundMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ref.read(adminBrandsProvider.notifier).deleteBrand(brand.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Brand deleted successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete brand: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }
}

class _BrandCard extends StatelessWidget {
  const _BrandCard({
    required this.brand,
    required this.onEdit,
    required this.onDelete,
  });

  final AdminBrand brand;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Row(
        children: [
          if (brand.logoUrl != null && brand.logoUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                brand.logoUrl!,
                width: 60,
                height: 60,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => _buildPlaceholder(),
              ),
            )
          else
            _buildPlaceholder(),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        brand.nameEn,
                        style: const TextStyle(
                          color: AppColors.foreground,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    if (!brand.isActive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLighter,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Inactive',
                          style: TextStyle(color: AppColors.foregroundMuted, fontSize: 12),
                        ),
                      ),
                  ],
                ),
                if (brand.nameAr.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    brand.nameAr,
                    style: const TextStyle(
                      color: AppColors.foregroundMuted,
                      fontSize: 14,
                    ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: const Icon(LucideIcons.pencil, color: AppColors.info),
            onPressed: onEdit,
          ),
          IconButton(
            icon: const Icon(LucideIcons.trash_2, color: AppColors.error),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: AppColors.backgroundSubtle,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: const Icon(LucideIcons.stamp, color: AppColors.foregroundMuted),
    );
  }
}

class _BrandFormSheet extends ConsumerStatefulWidget {
  const _BrandFormSheet({required this.brand});

  final AdminBrand? brand;

  @override
  ConsumerState<_BrandFormSheet> createState() => _BrandFormSheetState();
}

class _BrandFormSheetState extends ConsumerState<_BrandFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameEnController;
  late final TextEditingController _nameArController;
  late final TextEditingController _descEnController;
  late final TextEditingController _descArController;
  late final TextEditingController _logoUrlController;
  late bool _isActive;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameEnController = TextEditingController(text: widget.brand?.nameEn ?? '');
    _nameArController = TextEditingController(text: widget.brand?.nameAr ?? '');
    _descEnController = TextEditingController(text: widget.brand?.descriptionEn ?? '');
    _descArController = TextEditingController(text: widget.brand?.descriptionAr ?? '');
    _logoUrlController = TextEditingController(text: widget.brand?.logoUrl ?? '');
    _isActive = widget.brand?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameEnController.dispose();
    _nameArController.dispose();
    _descEnController.dispose();
    _descArController.dispose();
    _logoUrlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'name_en': _nameEnController.text.trim(),
      'name_ar': _nameArController.text.trim(),
      'description_en': _descEnController.text.trim(),
      'description_ar': _descArController.text.trim(),
      'logo_url': _logoUrlController.text.trim(),
      'is_active': _isActive,
    };

    try {
      if (widget.brand == null) {
        await ref.read(adminBrandsProvider.notifier).createBrand(data);
      } else {
        await ref.read(adminBrandsProvider.notifier).updateBrand(widget.brand!.id, data);
      }
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.brand == null ? 'Brand created' : 'Brand updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save brand: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 24,
      ),
      decoration: const BoxDecoration(
        color: AppColors.backgroundSubtle,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.brand == null ? 'New Brand' : 'Edit Brand',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.foreground,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: AppColors.foregroundMuted),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Name EN
                TextFormField(
                  controller: _nameEnController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Name (English)', LucideIcons.tag),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                  onChanged: (val) {
                    if (widget.brand == null && _nameArController.text.isEmpty) {
                      _nameArController.text = val;
                    }
                  },
                ),
                const SizedBox(height: 16),
                
                // Name AR
                TextFormField(
                  controller: _nameArController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Name (Arabic)', LucideIcons.tag),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                  textDirection: TextDirection.rtl,
                ),
                const SizedBox(height: 16),
                
                // Desc EN
                TextFormField(
                  controller: _descEnController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Description (English)', LucideIcons.file_text),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                
                // Desc AR
                TextFormField(
                  controller: _descArController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Description (Arabic)', LucideIcons.file_text),
                  maxLines: 2,
                  textDirection: TextDirection.rtl,
                ),
                const SizedBox(height: 16),
                
                // Logo URL
                TextFormField(
                  controller: _logoUrlController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Logo URL (optional)', LucideIcons.image),
                ),
                const SizedBox(height: 16),
                
                // Active Switch
                SwitchListTile(
                  title: const Text('Is Active', style: TextStyle(color: AppColors.foreground)),
                  value: _isActive,
                  onChanged: (val) => setState(() => _isActive = val),
                  activeThumbColor: AppColors.primary,
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 32),
                
                // Submit Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.background,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.background),
                        )
                      : Text(
                          widget.brand == null ? 'Create Brand' : 'Save Changes',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: AppColors.foregroundMuted),
      prefixIcon: Icon(icon, color: AppColors.foregroundMuted),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      filled: true,
      fillColor: AppColors.background,
    );
  }
}
