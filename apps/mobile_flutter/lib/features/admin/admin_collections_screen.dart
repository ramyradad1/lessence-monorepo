import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/app_colors.dart';
import 'models/admin_collection_model.dart';
import 'providers/admin_collections_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminCollectionsScreen extends ConsumerWidget {
  const AdminCollectionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminCollectionsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Collections Management'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminCollectionsProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: state.when(
        data: (collections) {
          if (collections.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.bookmark,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No collections found',
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
            onRefresh: () => ref.read(adminCollectionsProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: collections.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final collection = collections[index];
                return _CollectionCard(
                  collection: collection,
                  onEdit: () => _showCollectionForm(context, ref, collection),
                  onDelete: () => _confirmDelete(context, ref, collection),
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
            'Error loading collections:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.plus, color: AppColors.background),
        onPressed: () => _showCollectionForm(context, ref, null),
      ),
    );
  }

  void _showCollectionForm(BuildContext context, WidgetRef ref, AdminCollection? collection) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CollectionFormSheet(collection: collection),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, AdminCollection collection) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Collection?', style: TextStyle(color: AppColors.foreground)),
        content: Text(
          'Are you sure you want to delete "${collection.nameEn}"? This action cannot be undone.',
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
        await ref.read(adminCollectionsProvider.notifier).deleteCollection(collection.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Collection deleted successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete collection: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }
}

class _CollectionCard extends StatelessWidget {
  const _CollectionCard({
    required this.collection,
    required this.onEdit,
    required this.onDelete,
  });

  final AdminCollection collection;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Row(
        children: [
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
                        collection.nameEn,
                        style: const TextStyle(
                          color: AppColors.foreground,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    if (!collection.isActive)
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
                if (collection.nameAr.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    collection.nameAr,
                    style: const TextStyle(
                      color: AppColors.foregroundMuted,
                      fontSize: 14,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  'Slug: ${collection.slug}',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                  ),
                ),
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
      child: const Icon(LucideIcons.bookmark, color: AppColors.foregroundMuted),
    );
  }
}

class _CollectionFormSheet extends ConsumerStatefulWidget {
  const _CollectionFormSheet({required this.collection});

  final AdminCollection? collection;

  @override
  ConsumerState<_CollectionFormSheet> createState() => _CollectionFormSheetState();
}

class _CollectionFormSheetState extends ConsumerState<_CollectionFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _slugController;
  late final TextEditingController _nameEnController;
  late final TextEditingController _nameArController;
  late final TextEditingController _descEnController;
  late final TextEditingController _descArController;
  late bool _isActive;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _slugController = TextEditingController(text: widget.collection?.slug ?? '');
    _nameEnController = TextEditingController(text: widget.collection?.nameEn ?? '');
    _nameArController = TextEditingController(text: widget.collection?.nameAr ?? '');
    _descEnController = TextEditingController(text: widget.collection?.descriptionEn ?? '');
    _descArController = TextEditingController(text: widget.collection?.descriptionAr ?? '');
    _isActive = widget.collection?.isActive ?? true;
  }

  @override
  void dispose() {
    _slugController.dispose();
    _nameEnController.dispose();
    _nameArController.dispose();
    _descEnController.dispose();
    _descArController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'slug': _slugController.text.trim().toLowerCase().replaceAll(' ', '-'),
      'name_en': _nameEnController.text.trim(),
      'name_ar': _nameArController.text.trim(),
      'description_en': _descEnController.text.trim(),
      'description_ar': _descArController.text.trim(),
      'is_active': _isActive,
    };

    try {
      if (widget.collection == null) {
        await ref.read(adminCollectionsProvider.notifier).createCollection(data);
      } else {
        await ref.read(adminCollectionsProvider.notifier).updateCollection(widget.collection!.id, data);
      }
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.collection == null ? 'Collection created' : 'Collection updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save collection: $e'), backgroundColor: AppColors.error),
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
                      widget.collection == null ? 'New Collection' : 'Edit Collection',
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
                    if (widget.collection == null) {
                      if (_nameArController.text.isEmpty) {
                        _nameArController.text = val;
                      }
                      if (_slugController.text.isEmpty || _slugController.text == val.substring(0, val.length > 1 ? val.length - 1 : val.length).trim().toLowerCase().replaceAll(' ', '-')) {
                        _slugController.text = val.trim().toLowerCase().replaceAll(' ', '-');
                      }
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
                
                // Slug Field
                TextFormField(
                  controller: _slugController,
                  style: const TextStyle(color: AppColors.foregroundMuted),
                  decoration: _inputDecoration('URL Slug', LucideIcons.link),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
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
                          widget.collection == null ? 'Create Collection' : 'Save Changes',
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
