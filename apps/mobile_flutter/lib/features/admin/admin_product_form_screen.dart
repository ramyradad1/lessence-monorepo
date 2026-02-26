import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_colors.dart';
import 'models/admin_product_model.dart';
import 'providers/admin_products_provider.dart';
import 'providers/admin_categories_provider.dart';


class AdminProductFormScreen extends ConsumerStatefulWidget {
  const AdminProductFormScreen({super.key, this.productId});

  final String? productId; // null for new product

  @override
  ConsumerState<AdminProductFormScreen> createState() => _AdminProductFormScreenState();
}

class _AdminProductFormScreenState extends ConsumerState<AdminProductFormScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  // Basic Info
  final _nameEnController = TextEditingController();
  final _nameArController = TextEditingController();
  final _subtitleEnController = TextEditingController();
  final _subtitleArController = TextEditingController();
  final _descEnController = TextEditingController();
  final _descArController = TextEditingController();
  final _priceController = TextEditingController();
  final _skuController = TextEditingController();
  
  // Organization
  String? _selectedCategory;
  String? _genderTarget;
  bool _isActive = true;
  bool _isNew = false;

  // Variants
  List<AdminProductVariant> _variants = [];

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameEnController.dispose();
    _nameArController.dispose();
    _subtitleEnController.dispose();
    _subtitleArController.dispose();
    _descEnController.dispose();
    _descArController.dispose();
    _priceController.dispose();
    _skuController.dispose();
    super.dispose();
  }

  void _populateData(Map<String, dynamic> data) {
    final product = data['product'] as AdminProduct?;
    if (product != null) {
      _nameEnController.text = product.nameEn;
      _nameArController.text = product.nameAr;
      _subtitleEnController.text = product.subtitleEn ?? '';
      _subtitleArController.text = product.subtitleAr ?? '';
      _descEnController.text = product.descriptionEn ?? '';
      _descArController.text = product.descriptionAr ?? '';
      _priceController.text = product.price.toString();
      _skuController.text = product.sku ?? '';
      
      _selectedCategory = product.categoryId;
      _genderTarget = product.genderTarget;
      _isActive = product.isActive;
      _isNew = product.isNew;

      _variants = List<AdminProductVariant>.from(data['variants'] ?? []);
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) {
      _tabController.animateTo(0);
      return;
    }

    setState(() => _isSaving = true);

    try {
      final repo = ref.read(adminProductsRepositoryProvider);
      
      final slug = widget.productId != null 
          ? null
          : _nameEnController.text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');

      final productData = <String, dynamic>{
        'name': _nameEnController.text.trim(),
        'name_en': _nameEnController.text.trim(),
        'name_ar': _nameArController.text.trim(),
        'subtitle': _subtitleEnController.text.trim().isEmpty ? null : _subtitleEnController.text.trim(),
        'subtitle_en': _subtitleEnController.text.trim().isEmpty ? null : _subtitleEnController.text.trim(),
        'subtitle_ar': _subtitleArController.text.trim().isEmpty ? null : _subtitleArController.text.trim(),
        'description': _descEnController.text.trim().isEmpty ? null : _descEnController.text.trim(),
        'description_en': _descEnController.text.trim().isEmpty ? null : _descEnController.text.trim(),
        'description_ar': _descArController.text.trim().isEmpty ? null : _descArController.text.trim(),
        'price': double.tryParse(_priceController.text) ?? 0,
        'sku': _skuController.text.trim().isEmpty ? null : _skuController.text.trim(),
        'category_id': _selectedCategory,
        'gender_target': _genderTarget,
        'is_active': _isActive,
        'is_new': _isNew,
      };

      if (slug != null) {
        productData['slug'] = slug;
      }

      final savedProductId = await repo.saveProduct(widget.productId, productData);
      
      final variantsToSave = _variants.map((v) => v.toMap()).toList();
      await repo.saveVariants(savedProductId, variantsToSave);

      ref.invalidate(adminProductsProvider);
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product saved successfully', style: TextStyle(color: AppColors.background)), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving product: $e', style: const TextStyle(color: AppColors.background)), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.productId != null) {
      final detailsAsync = ref.watch(adminProductDetailsProvider(widget.productId!));
      
      return detailsAsync.when(
        loading: () => const Scaffold(backgroundColor: AppColors.background, body: Center(child: CircularProgressIndicator(color: AppColors.primary))),
        error: (err, st) => Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(backgroundColor: AppColors.backgroundSubtle, title: const Text('Edit Product')),
          body: Center(child: Text('Error loading details:\n$err', style: const TextStyle(color: AppColors.error))),
        ),
        data: (data) {
          if (_nameEnController.text.isEmpty && data['product'] != null) {
            _populateData(data);
          }
          return _buildFormScaffold();
        },
      );
    }

    return _buildFormScaffold();
  }

  Widget _buildFormScaffold() {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.productId == null ? 'New Product' : 'Edit Product'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.foregroundMuted,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Basic Info'),
            Tab(text: 'Organization'),
            Tab(text: 'Variants'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildBasicInfoTab(),
            _buildOrganizationTab(),
            _buildVariantsTab(),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppColors.surfaceCard.copyWith(
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [],
          borderRadius: BorderRadius.zero,
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.pop(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.foreground,
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProduct,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.background,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: AppColors.background, strokeWidth: 2))
                      : const Text('Save Product'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextFormField(
          controller: _nameEnController,
          style: const TextStyle(color: AppColors.foreground),
          decoration: _inputDeco('Product Name (English)*'),
          validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
          onChanged: (val) {
             if (widget.productId == null && _nameArController.text.isEmpty) {
               _nameArController.text = val;
             }
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _nameArController,
          style: const TextStyle(color: AppColors.foreground),
          decoration: _inputDeco('Product Name (Arabic)*'),
          textDirection: TextDirection.rtl,
          validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
             Expanded(
               child: TextFormField(
                  controller: _skuController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDeco('SKU*'),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                ),
             ),
             const SizedBox(width: 16),
             Expanded(
               child: TextFormField(
                  controller: _priceController,
                  style: const TextStyle(color: AppColors.foreground),
                  decoration: _inputDeco('Price (EGP)*'),
                  keyboardType: TextInputType.number,
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Required';
                    if (double.tryParse(val) == null) return 'Invalid number';
                    return null;
                  },
                ),
             ),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _subtitleEnController,
          style: const TextStyle(color: AppColors.foreground),
          decoration: _inputDeco('Subtitle (English)'),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _subtitleArController,
          style: const TextStyle(color: AppColors.foreground),
          textDirection: TextDirection.rtl,
          decoration: _inputDeco('Subtitle (Arabic)'),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _descEnController,
          style: const TextStyle(color: AppColors.foreground),
          decoration: _inputDeco('Description (English)'),
          maxLines: 4,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _descArController,
          style: const TextStyle(color: AppColors.foreground),
          textDirection: TextDirection.rtl,
          decoration: _inputDeco('Description (Arabic)'),
          maxLines: 4,
        ),
      ],
    );
  }

  Widget _buildOrganizationTab() {
    final categoriesAsync = ref.watch(adminCategoriesProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        categoriesAsync.when(
          data: (cats) => DropdownButtonFormField<String>(
            initialValue: cats.any((c) => c.id == _selectedCategory) ? _selectedCategory : null,
            dropdownColor: AppColors.surface,
            style: const TextStyle(color: AppColors.foreground),
            decoration: _inputDeco('Category'),
            items: cats.map((c) => DropdownMenuItem(value: c.id, child: Text(c.nameEn ?? c.name))).toList(),
            onChanged: (val) => setState(() => _selectedCategory = val),
          ),
          loading: () => const CircularProgressIndicator(),
          error: (_, err) => const Text('Error loading categories', style: TextStyle(color: AppColors.error)),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          initialValue: _genderTarget,
          dropdownColor: AppColors.surface,
          style: const TextStyle(color: AppColors.foreground),
          decoration: _inputDeco('Gender Target'),
          items: const [
            DropdownMenuItem(value: null, child: Text('All')),
            DropdownMenuItem(value: 'men', child: Text('Men')),
            DropdownMenuItem(value: 'women', child: Text('Women')),
            DropdownMenuItem(value: 'unisex', child: Text('Unisex')),
          ],
          onChanged: (val) => setState(() => _genderTarget = val),
        ),
        const SizedBox(height: 16),
        SwitchListTile(
          title: const Text('Is Active', style: TextStyle(color: AppColors.foreground)),
          subtitle: const Text('Product visibility on storefront', style: TextStyle(color: AppColors.foregroundMuted)),
          value: _isActive,
          onChanged: (val) => setState(() => _isActive = val),
          activeThumbColor: AppColors.primary,
        ),
        SwitchListTile(
          title: const Text('Is New', style: TextStyle(color: AppColors.foreground)),
          subtitle: const Text('Show "NEW" badge', style: TextStyle(color: AppColors.foregroundMuted)),
          value: _isNew,
          onChanged: (val) => setState(() => _isNew = val),
          activeThumbColor: AppColors.primary,
        ),
      ],
    );
  }

  Widget _buildVariantsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
             const Text('Product Variants', style: TextStyle(color: AppColors.foreground, fontSize: 18, fontWeight: FontWeight.bold)),
             TextButton.icon(
                icon: const Icon(LucideIcons.plus, color: AppColors.primary),
                label: const Text('Add Variant', style: TextStyle(color: AppColors.primary)),
                onPressed: _showVariantForm,
             ),
          ],
        ),
        const SizedBox(height: 16),
        if (_variants.isEmpty)
          const Padding(
            padding: EdgeInsets.all(32.0),
            child: Center(child: Text('No variants added yet. Add at least one variant (e.g. 50ml, 100ml).', style: TextStyle(color: AppColors.foregroundMuted), textAlign: TextAlign.center)),
          )
        else
          ..._variants.map((v) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: AppColors.surfaceCard,
            child: ListTile(
              title: Text('${v.sizeMl}ml - ${v.concentration ?? "N/A"}', style: const TextStyle(color: AppColors.foreground, fontWeight: FontWeight.bold)),
              subtitle: Text('Stock: ${v.stockQty} | Price: ${v.price} EGP | SKU: ${v.sku ?? "auto"}', style: const TextStyle(color: AppColors.foregroundMuted)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                   IconButton(icon: const Icon(LucideIcons.pencil, color: AppColors.info), onPressed: () => _showVariantForm(variant: v)),
                   IconButton(icon: const Icon(LucideIcons.trash_2, color: AppColors.error), onPressed: () {
                     setState(() => _variants.remove(v));
                   }),
                ],
              ),
            ),
          )),
      ],
    );
  }

  void _showVariantForm({AdminProductVariant? variant}) {
    final sizeController = TextEditingController(text: variant?.sizeMl.toString() ?? '');
    final concController = TextEditingController(text: variant?.concentration ?? 'EDP');
    final priceController = TextEditingController(text: variant?.price.toString() ?? '0');
    final stockController = TextEditingController(text: variant?.stockQty.toString() ?? '0');
    final skuController = TextEditingController(text: variant?.sku ?? '');
    
    showDialog(context: context, builder: (context) {
      return AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text(variant == null ? 'Add Variant' : 'Edit Variant', style: const TextStyle(color: AppColors.foreground)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
               TextFormField(controller: sizeController, decoration: _inputDeco('Size (ml)*'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.foreground)),
               const SizedBox(height: 12),
               TextFormField(controller: concController, decoration: _inputDeco('Concentration'), style: const TextStyle(color: AppColors.foreground)),
               const SizedBox(height: 12),
               TextFormField(controller: priceController, decoration: _inputDeco('Price (EGP)'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.foreground)),
               const SizedBox(height: 12),
               TextFormField(controller: stockController, decoration: _inputDeco('Stock Quantity'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.foreground)),
               const SizedBox(height: 12),
               TextFormField(controller: skuController, decoration: _inputDeco('SKU (optional)'), style: const TextStyle(color: AppColors.foreground)),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: AppColors.foregroundMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: AppColors.background),
            onPressed: () {
               final size = int.tryParse(sizeController.text);
               if (size == null) return;
               
               final newVariant = AdminProductVariant(
                  id: variant?.id ?? '',
                  productId: widget.productId ?? '',
                  sizeMl: size,
                  concentration: concController.text.isEmpty ? null : concController.text,
                  price: double.tryParse(priceController.text) ?? 0.0,
                  stockQty: int.tryParse(stockController.text) ?? 0,
                  sku: skuController.text.isEmpty ? null : skuController.text,
               );
               
               setState(() {
                 if (variant == null) {
                   _variants.add(newVariant);
                 } else {
                   final index = _variants.indexOf(variant);
                   if (index != -1) _variants[index] = newVariant;
                 }
               });
               Navigator.pop(context);
            }, 
            child: const Text('Save')
          ),
        ],
      );
    });
  }

  InputDecoration _inputDeco(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: AppColors.foregroundMuted),
      filled: true,
      fillColor: AppColors.surfaceLighter,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.primary)),
    );
  }
}
