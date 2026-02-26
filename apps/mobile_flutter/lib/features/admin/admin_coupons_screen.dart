import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../theme/app_colors.dart';
import 'models/admin_coupon_model.dart';
import 'providers/admin_coupons_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminCouponsScreen extends ConsumerWidget {
  const AdminCouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminCouponsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Coupons Management'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminCouponsProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: state.when(
        data: (coupons) {
          if (coupons.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.tag,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No coupons found',
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
            onRefresh: () => ref.read(adminCouponsProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: coupons.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final coupon = coupons[index];
                return _CouponCard(
                  coupon: coupon,
                  onEdit: () => _showCouponForm(context, ref, coupon),
                  onDelete: () => _confirmDelete(context, ref, coupon),
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
            'Error loading coupons:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.plus, color: AppColors.background),
        onPressed: () => _showCouponForm(context, ref, null),
      ),
    );
  }

  void _showCouponForm(BuildContext context, WidgetRef ref, AdminCoupon? coupon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CouponFormSheet(coupon: coupon),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, AdminCoupon coupon) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Coupon?', style: TextStyle(color: AppColors.foreground)),
        content: Text(
          'Are you sure you want to delete coupon code "${coupon.code}"? This action cannot be undone.',
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
        await ref.read(adminCouponsProvider.notifier).deleteCoupon(coupon.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Coupon deleted successfully')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete coupon: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({
    required this.coupon,
    required this.onEdit,
    required this.onDelete,
  });

  final AdminCoupon coupon;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final discountText = coupon.discountType == 'percentage'
        ? '${coupon.discountAmount.toStringAsFixed(0)}%'
        : '\$${coupon.discountAmount.toStringAsFixed(2)}';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppColors.surfaceCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(25),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary),
                ),
                child: Text(
                  coupon.code,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (!coupon.isActive)
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
              const Spacer(),
              IconButton(
                icon: const Icon(LucideIcons.pencil, color: AppColors.info),
                onPressed: onEdit,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 16),
              IconButton(
                icon: const Icon(LucideIcons.trash_2, color: AppColors.error),
                onPressed: onDelete,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildInfoItem('Discount', discountText),
              _buildInfoItem('Min Order', '\$${coupon.minOrderAmount.toStringAsFixed(2)}'),
              _buildInfoItem('Used', '${coupon.timesUsed}${coupon.usageLimit != null ? ' / ${coupon.usageLimit}' : ''}'),
            ],
          ),
          if (coupon.validFrom != null || coupon.validUntil != null) ...[
            const SizedBox(height: 12),
            const Divider(color: AppColors.border),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(LucideIcons.calendar, size: 14, color: AppColors.foregroundMuted),
                const SizedBox(width: 6),
                Text(
                  _formatDateRange(coupon.validFrom, coupon.validUntil),
                  style: const TextStyle(color: AppColors.foregroundMuted, fontSize: 12),
                ),
              ],
            ),
          ]
        ],
      ),
    );
  }
  
  String _formatDateRange(DateTime? start, DateTime? end) {
    final format = DateFormat('MMM d, yyyy');
    if (start != null && end != null) {
      return '${format.format(start)} - ${format.format(end)}';
    } else if (start != null) {
      return 'From ${format.format(start)}';
    } else if (end != null) {
      return 'Until ${format.format(end)}';
    }
    return '';
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.foregroundMuted, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(color: AppColors.foreground, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

class _CouponFormSheet extends ConsumerStatefulWidget {
  const _CouponFormSheet({required this.coupon});

  final AdminCoupon? coupon;

  @override
  ConsumerState<_CouponFormSheet> createState() => _CouponFormSheetState();
}

class _CouponFormSheetState extends ConsumerState<_CouponFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _codeController;
  late final TextEditingController _discountAmountController;
  late final TextEditingController _minOrderAmountController;
  late final TextEditingController _usageLimitController;
  
  String _discountType = 'percentage';
  late bool _isActive;
  DateTime? _validFrom;
  DateTime? _validUntil;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _codeController = TextEditingController(text: widget.coupon?.code ?? '');
    _discountAmountController = TextEditingController(text: widget.coupon?.discountAmount.toString() ?? '');
    _minOrderAmountController = TextEditingController(text: widget.coupon?.minOrderAmount.toString() ?? '0');
    _usageLimitController = TextEditingController(text: widget.coupon?.usageLimit?.toString() ?? '');
    
    if (widget.coupon != null) {
      _discountType = widget.coupon!.discountType;
      _isActive = widget.coupon!.isActive;
      _validFrom = widget.coupon!.validFrom;
      _validUntil = widget.coupon!.validUntil;
    } else {
      _isActive = true;
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    _discountAmountController.dispose();
    _minOrderAmountController.dispose();
    _usageLimitController.dispose();
    super.dispose();
  }

  Future<void> _selectDateText(BuildContext context, bool isStart) async {
    final initialDate = isStart
        ? (_validFrom ?? DateTime.now())
        : (_validUntil ?? _validFrom ?? DateTime.now());
        
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    
    if (picked != null) {
      setState(() {
        if (isStart) {
          _validFrom = picked;
          // Ensure end date is not before start date
          if (_validUntil != null && _validUntil!.isBefore(_validFrom!)) {
            _validUntil = _validFrom;
          }
        } else {
          _validUntil = picked;
          // Ensure start date is not after end date
          if (_validFrom != null && _validFrom!.isAfter(_validUntil!)) {
            _validFrom = _validUntil;
          }
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'code': _codeController.text.trim().toUpperCase(),
      'discount_type': _discountType,
      'discount_amount': double.parse(_discountAmountController.text.trim()),
      'min_order_amount': double.tryParse(_minOrderAmountController.text.trim()) ?? 0.0,
      'usage_limit': _usageLimitController.text.trim().isNotEmpty 
          ? int.tryParse(_usageLimitController.text.trim()) 
          : null,
      'valid_from': _validFrom?.toIso8601String(),
      'valid_until': _validUntil?.toIso8601String(),
      'is_active': _isActive,
    };

    try {
      if (widget.coupon == null) {
        await ref.read(adminCouponsProvider.notifier).createCoupon(data);
      } else {
        await ref.read(adminCouponsProvider.notifier).updateCoupon(widget.coupon!.id, data);
      }
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.coupon == null ? 'Coupon created' : 'Coupon updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save coupon: $e'), backgroundColor: AppColors.error),
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
                      widget.coupon == null ? 'New Coupon' : 'Edit Coupon',
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
                
                // Code
                TextFormField(
                  controller: _codeController,
                  style: const TextStyle(color: AppColors.foreground),
                  textCapitalization: TextCapitalization.characters,
                  decoration: _inputDecoration('Coupon Code', LucideIcons.tag),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                
                // Type & Value
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: DropdownButtonFormField<String>(
                        initialValue: _discountType,
                        dropdownColor: AppColors.surface,
                        style: const TextStyle(color: AppColors.foreground),
                        decoration: _inputDecoration('Type', LucideIcons.percent),
                        items: const [
                          DropdownMenuItem(value: 'percentage', child: Text('Percentage %')),
                          DropdownMenuItem(value: 'fixed', child: Text('Fixed Amount \$')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _discountType = val);
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 1,
                      child: TextFormField(
                        controller: _discountAmountController,
                        style: const TextStyle(color: AppColors.foreground),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: _inputDecoration('Value', LucideIcons.banknote),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) return 'Required';
                          if (double.tryParse(val) == null) return 'Invalid number';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Min Order Amount
                TextFormField(
                  controller: _minOrderAmountController,
                  style: const TextStyle(color: AppColors.foreground),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: _inputDecoration('Minimum Order Amount', LucideIcons.shopping_bag),
                ),
                const SizedBox(height: 16),


                
                // Usage Limit
                TextFormField(
                  controller: _usageLimitController,
                  style: const TextStyle(color: AppColors.foreground),
                  keyboardType: TextInputType.number,
                  decoration: _inputDecoration('Usage Limit (Optional)', LucideIcons.users),
                ),
                const SizedBox(height: 16),
                
                // Valid Dates
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectDateText(context, true),
                        child: InputDecorator(
                          decoration: _inputDecoration('Valid From (Optional)', LucideIcons.calendar),
                          child: Text(
                            _validFrom != null ? DateFormat('MMM d, yyyy').format(_validFrom!) : 'Not set',
                            style: TextStyle(color: _validFrom != null ? AppColors.foreground : AppColors.foregroundMuted),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectDateText(context, false),
                        child: InputDecorator(
                          decoration: _inputDecoration('Valid Until (Optional)', LucideIcons.calendar),
                          child: Text(
                            _validUntil != null ? DateFormat('MMM d, yyyy').format(_validUntil!) : 'Not set',
                            style: TextStyle(color: _validUntil != null ? AppColors.foreground : AppColors.foregroundMuted),
                          ),
                        ),
                      ),
                    ),
                  ],
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
                          widget.coupon == null ? 'Create Coupon' : 'Save Changes',
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
