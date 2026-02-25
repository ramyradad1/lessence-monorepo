import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/models/app_models.dart';
import '../../../core/providers/profile_provider.dart';

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
  late final TextEditingController _countryController;
  late bool _isDefault;

  @override
  void initState() {
    super.initState();
    final address = widget.address;
    _fullNameController = TextEditingController(text: address?.fullName ?? '');
    _phoneController = TextEditingController(text: address?.phone ?? '');
    _line1Controller = TextEditingController(text: address?.addressLine1 ?? '');
    _line2Controller = TextEditingController(text: address?.addressLine2 ?? '');
    _cityController = TextEditingController(text: address?.city ?? '');
    _stateController = TextEditingController(text: address?.state ?? '');
    _postalController = TextEditingController(text: address?.postalCode ?? '');
    _countryController = TextEditingController(text: address?.country ?? 'EG');
    _isDefault = address?.isDefault ?? false;
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
    _countryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final profileState = ref.watch(profileControllerProvider);
    final isEditing = widget.address != null;

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.viewInsetsOf(context).bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                isEditing ? l10n.text('editAddress') : l10n.text('newAddress'),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),
              _AddressField(
                controller: _fullNameController,
                label: l10n.text('fullNameLabel'),
                requiredField: true,
              ),
              const SizedBox(height: 8),
              _AddressField(
                controller: _phoneController,
                label: l10n.text('phoneLabel'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 8),
              _AddressField(
                controller: _line1Controller,
                label: l10n.text('addressLine1'),
                requiredField: true,
              ),
              const SizedBox(height: 8),
              _AddressField(
                controller: _line2Controller,
                label: l10n.text('addressLine2'),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _AddressField(
                      controller: _cityController,
                      label: l10n.text('city'),
                      requiredField: true,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _AddressField(
                      controller: _stateController,
                      label: l10n.text('state'),
                      requiredField: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _AddressField(
                      controller: _postalController,
                      label: l10n.text('postalCode'),
                      requiredField: true,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _AddressField(
                      controller: _countryController,
                      label: l10n.text('country'),
                      requiredField: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: _isDefault,
                onChanged: (value) => setState(() => _isDefault = value),
                title: Text(l10n.text('defaultAddress')),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: profileState.isSaving
                          ? null
                          : () => Navigator.of(context).pop(),
                      child: Text(l10n.text('cancel')),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: profileState.isSaving ? null : _save,
                      child: profileState.isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(l10n.text('saveAddress')),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.text('fillRequiredFields'))),
      );
      return;
    }

    final draft = AddressDraft(
      fullName: _fullNameController.text.trim(),
      phone: _phoneController.text.trim(),
      addressLine1: _line1Controller.text.trim(),
      addressLine2: _line2Controller.text.trim(),
      city: _cityController.text.trim(),
      state: _stateController.text.trim(),
      postalCode: _postalController.text.trim(),
      country: _countryController.text.trim().toUpperCase(),
      isDefault: _isDefault,
    );

    await ref.read(profileControllerProvider.notifier).saveAddress(
          draft,
          addressId: widget.address?.id,
        );

    if (!mounted) return;
    final errorMessage = ref.read(profileControllerProvider).errorMessage;
    if (errorMessage == null) {
      Navigator.of(context).pop();
    }
  }
}

class _AddressField extends StatelessWidget {
  const _AddressField({
    required this.controller,
    required this.label,
    this.requiredField = false,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final bool requiredField;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      validator: (value) {
        if (requiredField && (value == null || value.trim().isEmpty)) {
          return context.l10n.text('fillRequiredFields');
        }
        return null;
      },
    );
  }
}
