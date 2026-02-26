import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/models/app_models.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../theme/app_colors.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

class AddressEditorSheet extends ConsumerStatefulWidget {
  const AddressEditorSheet({super.key, this.address});

  final AddressModel? address;

  @override
  ConsumerState<AddressEditorSheet> createState() => _AddressEditorSheetState();
}

class _AddressEditorSheetState extends ConsumerState<AddressEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  
  late final TextEditingController _fullNameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _line1Controller;
  late final TextEditingController _line2Controller;
  late final TextEditingController _cityController;
  late final TextEditingController _stateController;
  late final TextEditingController _postalController;
  
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final addr = widget.address;
    _fullNameController = TextEditingController(text: addr?.fullName ?? '');
    _phoneController = TextEditingController(text: addr?.phone ?? '');
    _line1Controller = TextEditingController(text: addr?.addressLine1 ?? '');
    _line2Controller = TextEditingController(text: addr?.addressLine2 ?? '');
    _cityController = TextEditingController(text: addr?.city ?? '');
    _stateController = TextEditingController(text: addr?.state ?? '');
    _postalController = TextEditingController(text: addr?.postalCode ?? '');
    _isDefault = addr?.isDefault ?? false;
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalController.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;

    final draft = AddressDraft(
      fullName: _fullNameController.text.trim(),
      phone: _phoneController.text.trim(),
      addressLine1: _line1Controller.text.trim(),
      addressLine2: _line2Controller.text.trim(),
      city: _cityController.text.trim(),
      state: _stateController.text.trim(),
      postalCode: _postalController.text.trim(),
      country: 'Egypt',
      isDefault: _isDefault,
    );

    ref
        .read(profileControllerProvider.notifier)
        .saveAddress(draft, addressId: widget.address?.id);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.address == null
                    ? l10n.text('addAddress')
                    : l10n.text('editAddress'),
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              IconButton(
                icon: const Icon(LucideIcons.x),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Flexible(
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _fullNameController,
                      decoration: InputDecoration(
                        labelText: l10n.text('fullNameLabel'),
                        prefixIcon: const Icon(LucideIcons.user),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? l10n.text('required')
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: l10n.text('phoneLabel'),
                        prefixIcon: const Icon(LucideIcons.phone),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? l10n.text('required')
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _line1Controller,
                      decoration: InputDecoration(
                        labelText: l10n.text('addressLabel'),
                        prefixIcon: const Icon(LucideIcons.map_pin),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? l10n.text('required')
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _line2Controller,
                      decoration: InputDecoration(
                        labelText: l10n.text('apartmentLabel'),
                        prefixIcon: const Icon(LucideIcons.building),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _cityController,
                            decoration: InputDecoration(
                              labelText: l10n.text('cityLabel'),
                            ),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? l10n.text('required')
                                : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _stateController,
                            decoration: InputDecoration(
                              labelText: l10n.text('stateLabel'),
                            ),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? l10n.text('required')
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _postalController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: l10n.text('postalLabel'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.backgroundSubtle,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: CheckboxListTile(
                        value: _isDefault,
                        onChanged: (v) =>
                            setState(() => _isDefault = v ?? false),
                        title: Text(l10n.text('setAsDefault')),
                        activeColor: AppColors.primary,
                        controlAffinity: ListTileControlAffinity.leading,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(
            height: 52,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  l10n.text('saveAddress'),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
