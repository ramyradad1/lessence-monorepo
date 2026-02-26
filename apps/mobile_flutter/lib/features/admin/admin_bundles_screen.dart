import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/app_colors.dart';
import 'models/admin_bundle_model.dart';
import 'providers/admin_bundles_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminBundlesScreen extends ConsumerWidget {
  const AdminBundlesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminBundlesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Gift Sets Management'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminBundlesProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: state.when(
        data: (bundles) {
          if (bundles.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.gift,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No gift sets found',
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
            onRefresh: () => ref.read(adminBundlesProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: bundles.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final bundle = bundles[index];
                return _BundleCard(
                  bundle: bundle,
                  onEdit: () => _showBundleForm(context, ref, bundle),
                  onDelete: () => _confirmDelete(context, ref, bundle),
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
            'Error loading gift sets:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.plus, color: AppColors.background),
        onPressed: () => _showBundleForm(context, ref, null),
      ),
    );
  }

  void _showBundleForm(BuildContext context, WidgetRef ref, AdminBundle? bundle) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _BundleFormSheet(bundle: bundle),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, AdminBundle bundle) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Gift Set?', style: TextStyle(color: AppColors.foreground)),
        content: Text(
          'Are you sure you want to delete "${bundle.nameEn}"? This action cannot be undone.',
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
        await ref.read(adminBundlesProvider.notifier).deleteBundle(bundle.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Gift Set deleted successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete gift set: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }
}

class _BundleCard extends StatelessWidget {
  const _BundleCard({
    required this.bundle,
    required this.onEdit,
    required this.onDelete,
  });

  final AdminBundle bundle;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Row(
        children: [
          if (bundle.imageUrl != null && bundle.imageUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                bundle.imageUrl!,
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
                        bundle.nameEn,
                        style: const TextStyle(
                          color: AppColors.foreground,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    if (!bundle.isActive)
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
                const SizedBox(height: 4),
                Text(
                  '${bundle.price.toStringAsFixed(2)} KWD',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (bundle.nameAr.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    bundle.nameAr,
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
      child: const Icon(LucideIcons.gift, color: AppColors.foregroundMuted),
    );
  }
}

class _BundleFormSheet extends ConsumerStatefulWidget {
  const _BundleFormSheet({required this.bundle});

  final AdminBundle? bundle;

  @override
  ConsumerState<_BundleFormSheet> createState() => _BundleFormSheetState();
}

class _BundleFormSheetState extends ConsumerState<_BundleFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameEnController;
  late final TextEditingController _nameArController;
  late final TextEditingController _descEnController;
  late final TextEditingController _descArController;
  late final TextEditingController _priceController;
  late final TextEditingController _imageUrlController;
  late bool _isActive;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameEnController = TextEditingController(text: widget.bundle?.nameEn ?? '');
    _nameArController = TextEditingController(text: widget.bundle?.nameAr ?? '');
    _descEnController = TextEditingController(text: widget.bundle?.descriptionEn ?? '');
    _descArController = TextEditingController(text: widget.bundle?.descriptionAr ?? '');
    _priceController = TextEditingController(text: widget.bundle?.price.toString() ?? '');
    _imageUrlController = TextEditingController(text: widget.bundle?.imageUrl ?? '');
    _isActive = widget.bundle?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameEnController.dispose();
    _nameArController.dispose();
    _descEnController.dispose();
    _descArController.dispose();
    _priceController.dispose();
    _imageUrlController.dispose();
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
      'price': double.tryParse(_priceController.text.trim()) ?? 0,
      'image_url': _imageUrlController.text.trim(),
      'is_active': _isActive,
    };

    try {
      if (widget.bundle == null) {
        await ref.read(adminBundlesProvider.notifier).createBundle(data);
      } else {
        await ref.read(adminBundlesProvider.notifier).updateBundle(widget.bundle!.id, data);
      }
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.bundle == null ? 'Gift Set created' : 'Gift Set updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save gift set: $e'), backgroundColor: AppColors.error),
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
                      widget.bundle == null ? 'New Gift Set' : 'Edit Gift Set',
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
                    if (widget.bundle == null && _nameArController.text.isEmpty) {
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

                // Price
                TextFormField(
                  controller: _priceController,
                  style: const TextStyle(color: AppColors.foreground),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: _inputDecoration('Price', LucideIcons.circle_dollar_sign),
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) return 'Required';
                    if (double.tryParse(val) == null) return 'Must be a number';
                    return null;
                  },
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
                
                // Image URL
                TextFormField(
                  controller: _imageUrlController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Image URL (optional)', LucideIcons.image),
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
                          widget.bundle == null ? 'Create Gift Set' : 'Save Changes',
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
