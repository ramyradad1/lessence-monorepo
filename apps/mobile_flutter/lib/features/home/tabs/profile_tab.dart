import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../core/providers/profile_provider.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../theme/app_colors.dart';
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

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.text('profile')),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.log_out),
            onPressed: () {
              ref.read(authNotifierProvider).signOut();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: profileController.refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (profileState.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: InlineMessage(text: profileState.errorMessage!),
                ),
              // Header / Avatar Section
              Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 32,
                  horizontal: 16,
                ),
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppColors.borderHover),
                  ),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 48,
                      backgroundColor: AppColors.surfaceLighter,
                      child: Builder(
                        builder: (context) {
                          final name = profile?.fullName;
                          final em = profile?.email;
                          String initial = '?';

                          if (name != null && name.isNotEmpty) {
                            initial = name[0];
                          } else if (em != null && em.isNotEmpty) {
                            initial = em[0];
                          }

                          return Text(
                            initial.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      profile?.fullName?.isNotEmpty == true
                          ? profile!.fullName!
                          : l10n.text('guest'),
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    if (profile?.email != null)
                      Text(
                        profile!.email,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.foregroundMuted,
                        ),
                      ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => _showEditProfileModal(
                        context,
                        profileController,
                        l10n,
                      ),
                      icon: const Icon(LucideIcons.pencil, size: 18),
                      label: Text(l10n.text('editProfile')),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.foreground,
                        side: const BorderSide(color: AppColors.borderHover),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Settings Sections
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle('Account', context),
                    const SizedBox(height: 8),
                    Container(
                      decoration: AppColors.surfaceCard,
                      child: Column(
                        children: [
                          _buildListTile(
                            icon: LucideIcons.package,
                            title: l10n.text('orders'),
                            onTap: () => context.push('/orders'),
                          ),
                          const Divider(height: 1, color: AppColors.border),
                          _buildListTile(
                            icon: LucideIcons.map_pin,
                            title: l10n.text('addresses'),
                            onTap: () => _openAddressEditor(context),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    _buildSectionTitle('Preferences', context),
                    const SizedBox(height: 8),
                    Container(
                      decoration: AppColors.surfaceCard,
                      child: Column(
                        children: [
                          _buildListTile(
                            icon: LucideIcons.globe,
                            title: l10n.text('language'),
                            subtitle: switch (localePreference) {
                              AppLanguage.system => l10n.text('languageSystem'),
                              AppLanguage.english => l10n.text(
                                'languageEnglish',
                              ),
                              AppLanguage.arabic => l10n.text('languageArabic'),
                            },
                            onTap: () => _showLanguageModal(
                              context,
                              localePreference,
                              localeController,
                              l10n,
                            ),
                          ),
                        ],
                      ),
                    ),

                    if (profile != null &&
                        (profile.role == 'admin' ||
                            profile.role == 'super_admin')) ...[
                      const SizedBox(height: 24),
                      _buildSectionTitle('Administration', context),
                      const SizedBox(height: 8),
                      Container(
                        decoration: AppColors.surfaceCard,
                        child: _buildListTile(
                          icon: LucideIcons.shield_alert,
                          title: 'Admin Panel',
                          iconColor: AppColors.primary,
                          textColor: AppColors.primary,
                          onTap: () => context.push('/admin'),
                        ),
                      ),
                    ],

                    const SizedBox(height: 120),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 4),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.foregroundMuted,
          letterSpacing: 1.2,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Color? iconColor,
    Color? textColor,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.foregroundMuted),
      title: Text(
        title,
        style: TextStyle(
          color: textColor ?? AppColors.foreground,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: const TextStyle(color: AppColors.foregroundFaint),
            )
          : null,
      trailing: const Icon(
        LucideIcons.chevron_right,
        color: AppColors.foregroundFaint,
        size: 20,
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  void _showEditProfileModal(
    BuildContext context,
    ProfileController profileController,
    var l10n,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l10n.text('editProfile') ?? 'Edit Profile',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _fullNameController,
                decoration: InputDecoration(
                  labelText: l10n.text('fullNameLabel'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: AppColors.background,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: l10n.text('phoneLabel'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: AppColors.background,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {
                  profileController.updateProfile(
                    fullName: _fullNameController.text,
                    phone: _phoneController.text,
                  );
                  Navigator.pop(context);
                },
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.background,
                ),
                child: Text(
                  l10n.text('saveProfile'),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  void _showLanguageModal(
    BuildContext context,
    AppLanguage currentLocale,
    LocaleController localeController,
    var l10n,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 16),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderHover,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                l10n.text('language'),
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _buildLanguageOption(
                context,
                title: l10n.text('languageSystem'),
                value: AppLanguage.system,
                groupValue: currentLocale,
                onChanged: (val) {
                  localeController.setLanguage(val!);
                  Navigator.pop(context);
                },
              ),
              _buildLanguageOption(
                context,
                title: l10n.text('languageEnglish'),
                value: AppLanguage.english,
                groupValue: currentLocale,
                onChanged: (val) {
                  localeController.setLanguage(val!);
                  Navigator.pop(context);
                },
              ),
              _buildLanguageOption(
                context,
                title: l10n.text('languageArabic'),
                value: AppLanguage.arabic,
                groupValue: currentLocale,
                onChanged: (val) {
                  localeController.setLanguage(val!);
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLanguageOption(
    BuildContext context, {
    required String title,
    required AppLanguage value,
    required AppLanguage groupValue,
    required ValueChanged<AppLanguage?> onChanged,
  }) {
    return InkWell(
      onTap: () => onChanged(value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(color: AppColors.foreground),
              ),
            ),
            // ignore: deprecated_member_use
            Radio<AppLanguage>(
              value: value,
              // ignore: deprecated_member_use
              groupValue: groupValue,
              // ignore: deprecated_member_use
              onChanged: onChanged,
              activeColor: AppColors.primary,
            ),
          ],
        ),
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
      backgroundColor:
          Colors.transparent, // Let AddressEditorSheet handle background
      builder: (_) => AddressEditorSheet(address: address),
    );
  }
}
