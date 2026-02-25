import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../widgets/address_editor_sheet.dart';
import '../widgets/home_widgets.dart';

class ProfileTab extends ConsumerStatefulWidget {
  const ProfileTab({super.key});

  @override
  ConsumerState<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends ConsumerState<ProfileTab> {
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  String? _profileBindKey;

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final profileState = ref.watch(profileControllerProvider);
    final profileController = ref.read(profileControllerProvider.notifier);
    final localePreference = ref.watch(appLanguagePreferenceProvider);
    final localeController = ref.read(localeControllerProvider.notifier);
    final profile = profileState.profile;

    if (profile != null) {
      final bindKey =
          '${profile.id}:${profile.fullName ?? ''}:${profile.phone ?? ''}';
      if (_profileBindKey != bindKey) {
        _profileBindKey = bindKey;
        _fullNameController.text = profile.fullName ?? '';
        _phoneController.text = profile.phone ?? '';
      }
    }

    return RefreshIndicator(
      onRefresh: profileController.refresh,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          if (profileState.errorMessage != null) ...[
            InlineMessage(text: profileState.errorMessage!),
            const SizedBox(height: 8),
          ],
          if (profileState.isLoading)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Center(child: Text(l10n.text('loading'))),
            ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.text('profileInfo'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    profile?.email ?? '',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _fullNameController,
                    decoration: InputDecoration(
                      labelText: l10n.text('fullNameLabel'),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: l10n.text('phoneLabel'),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (!profileState.profileRowExists)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        l10n.text('profileRowMissing'),
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                      ),
                    ),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.tonal(
                      onPressed: profileState.isSaving || profile == null
                          ? null
                          : () => profileController.updateProfile(
                              fullName: _fullNameController.text,
                              phone: _phoneController.text,
                            ),
                      child: Text(l10n.text('saveProfile')),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.language),
                  title: Text(l10n.text('language')),
                  subtitle: Text(switch (localePreference) {
                    AppLanguage.system => l10n.text('languageSystem'),
                    AppLanguage.english => l10n.text('languageEnglish'),
                    AppLanguage.arabic => l10n.text('languageArabic'),
                  }),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  child: SegmentedButton<AppLanguage>(
                    segments: [
                      ButtonSegment<AppLanguage>(
                        value: AppLanguage.system,
                        label: Text(l10n.text('languageSystem')),
                      ),
                      ButtonSegment<AppLanguage>(
                        value: AppLanguage.english,
                        label: Text(l10n.text('languageEnglish')),
                      ),
                      ButtonSegment<AppLanguage>(
                        value: AppLanguage.arabic,
                        label: Text(l10n.text('languageArabic')),
                      ),
                    ],
                    selected: {localePreference},
                    onSelectionChanged: (selection) {
                      if (selection.isEmpty) return;
                      localeController.setLanguage(selection.first);
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          l10n.text('addresses'),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () => _openAddressEditor(context),
                        icon: const Icon(Icons.add),
                        label: Text(l10n.text('addAddress')),
                      ),
                    ],
                  ),
                  if (profileState.addresses.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(l10n.text('addressesEmpty')),
                    ),
                  for (final address in profileState.addresses)
                    AddressCardTile(
                      address: address,
                      onEdit: () =>
                          _openAddressEditor(context, addressId: address.id),
                      onDelete: () => ref
                          .read(profileControllerProvider.notifier)
                          .deleteAddress(address.id),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Future<void> _openAddressEditor(
    BuildContext context, {
    String? addressId,
  }) async {
    final addresses = ref.read(profileControllerProvider).addresses;
    final address = addressId == null
        ? null
        : addresses
              .where((item) => item.id == addressId)
              .cast<dynamic>()
              .isEmpty
        ? null
        : addresses.firstWhere((item) => item.id == addressId);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => AddressEditorSheet(address: address),
    );
  }
}
