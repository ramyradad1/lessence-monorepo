import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/app_colors.dart';
import '../catalog/models/catalog_models.dart';
import 'providers/admin_categories_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminCategoriesScreen extends ConsumerStatefulWidget {
  const AdminCategoriesScreen({super.key});

  @override
  ConsumerState<AdminCategoriesScreen> createState() => _AdminCategoriesScreenState();
}

class _AdminCategoriesScreenState extends ConsumerState<AdminCategoriesScreen> {
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
      ref.read(adminCategoriesProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminCategoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Categories Management'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminCategoriesProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: state.when(
        data: (categories) {
          if (categories.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.layout_grid,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No categories found',
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
            onRefresh: () => ref.read(adminCategoriesProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: categories.length + (state.isLoading ? 1 : 0),
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                if (index == categories.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  );
                }
                final category = categories[index];
                return _CategoryCard(
                  category: category,
                  onEdit: () => _showCategoryForm(context, ref, category),
                  onDelete: () => _confirmDelete(context, ref, category),
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
            'Error loading categories:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.plus, color: AppColors.background),
        onPressed: () => _showCategoryForm(context, ref, null),
      ),
    );
  }

  void _showCategoryForm(BuildContext context, WidgetRef ref, CatalogCategory? category) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CategoryFormSheet(category: category),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, CatalogCategory category) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Category?', style: TextStyle(color: AppColors.foreground)),
        content: Text(
          'Are you sure you want to delete "${category.name}"? This action cannot be undone.',
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
        await ref.read(adminCategoriesProvider.notifier).deleteCategory(category.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Category deleted successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete category: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.category,
    required this.onEdit,
    required this.onDelete,
  });

  final CatalogCategory category;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Row(
        children: [
          if (category.imageUrl != null && category.imageUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                category.imageUrl!,
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
                Text(
                  category.name,
                  style: const TextStyle(
                    color: AppColors.foreground,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (category.description != null && category.description!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    category.description!,
                    style: const TextStyle(
                      color: AppColors.foregroundMuted,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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
      child: const Icon(LucideIcons.layout_grid, color: AppColors.foregroundMuted),
    );
  }
}

class _CategoryFormSheet extends ConsumerStatefulWidget {
  const _CategoryFormSheet({required this.category});

  final CatalogCategory? category;

  @override
  ConsumerState<_CategoryFormSheet> createState() => _CategoryFormSheetState();
}

class _CategoryFormSheetState extends ConsumerState<_CategoryFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _slugController;
  late final TextEditingController _descController;
  late final TextEditingController _imageUrlController;
  late int _sortOrder;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.category?.name ?? '');
    _slugController = TextEditingController(text: widget.category?.slug ?? '');
    _descController = TextEditingController(text: widget.category?.description ?? '');
    _imageUrlController = TextEditingController(text: widget.category?.imageUrl ?? '');
    _sortOrder = widget.category?.sortOrder ?? 0;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _slugController.dispose();
    _descController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'name': _nameController.text.trim(),
      'name_en': _nameController.text.trim(), // Defaulting EN to name
      'slug': _slugController.text.trim().toLowerCase().replaceAll(' ', '-'),
      'description': _descController.text.trim(),
      'description_en': _descController.text.trim(),
      'image_url': _imageUrlController.text.trim(),
      'sort_order': _sortOrder,
    };

    try {
      if (widget.category == null) {
        await ref.read(adminCategoriesProvider.notifier).createCategory(data);
      } else {
        await ref.read(adminCategoriesProvider.notifier).updateCategory(widget.category!.id, data);
      }
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.category == null ? 'Category created' : 'Category updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save category: $e'), backgroundColor: AppColors.error),
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
                      widget.category == null ? 'New Category' : 'Edit Category',
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
                
                // Name Field
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Category Name', LucideIcons.tag),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Name is required' : null,
                  onChanged: (val) {
                    if (widget.category == null) {
                      _slugController.text = val.trim().toLowerCase().replaceAll(' ', '-');
                    }
                  },
                ),
                const SizedBox(height: 16),
                
                // Slug Field
                TextFormField(
                  controller: _slugController,
                  style: const TextStyle(color: AppColors.foregroundMuted),
                  decoration: _inputDecoration('URL Slug', LucideIcons.link),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Slug is required' : null,
                ),
                const SizedBox(height: 16),
                
                // Description Field
                TextFormField(
                  controller: _descController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Description', LucideIcons.file_text),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                
                // Image URL
                TextFormField(
                  controller: _imageUrlController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Image URL (optional)', LucideIcons.image),
                ),
                const SizedBox(height: 16),
                
                // Sort Order
                TextFormField(
                  initialValue: _sortOrder.toString(),
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDecoration('Sort Order', LucideIcons.arrow_up_down),
                  keyboardType: TextInputType.number,
                  onChanged: (val) {
                    _sortOrder = int.tryParse(val) ?? 0;
                  },
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
                          widget.category == null ? 'Create Category' : 'Save Changes',
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
