import 'package:flutter_lucide/flutter_lucide.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/app_colors.dart';
import 'models/admin_setting_model.dart';
import 'providers/admin_settings_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminSettingsScreen extends ConsumerWidget {
  const AdminSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminSettingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Store Settings'),
        backgroundColor: AppColors.backgroundSubtle,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refresh_cw),
            onPressed: () => ref.read(adminSettingsProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AdminDrawer(),
      body: state.when(
        data: (settings) {
          if (settings.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.settings,
                    size: 64,
                    color: AppColors.foregroundMuted,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No settings found',
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
            onRefresh: () => ref.read(adminSettingsProvider.notifier).refresh(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: settings.length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final setting = settings[index];
                return _SettingSection(setting: setting);
              },
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (err, st) => Center(
          child: Text(
            'Error loading settings:\n$err',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
    );
  }
}

class _SettingSection extends ConsumerStatefulWidget {
  const _SettingSection({required this.setting});

  final AdminSetting setting;

  @override
  ConsumerState<_SettingSection> createState() => _SettingSectionState();
}

class _SettingSectionState extends ConsumerState<_SettingSection> {
  bool _isExpanded = false;
  late Map<String, dynamic> _localValue;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _localValue = Map.from(widget.setting.value);
  }

  @override
  void didUpdateWidget(covariant _SettingSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.setting.value != widget.setting.value && !_isExpanded) {
      _localValue = Map.from(widget.setting.value);
    }
  }

  @override
  Widget build(BuildContext context) {
    final label = _formatKey(widget.setting.key);

    return Container(
      decoration: AppColors.surfaceCard,
      clipBehavior: Clip.hardEdge,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(
            label,
            style: const TextStyle(
              color: AppColors.foreground,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          iconColor: AppColors.primary,
          collapsedIconColor: AppColors.foregroundMuted,
          onExpansionChanged: (expanded) {
            setState(() {
              _isExpanded = expanded;
              if (!expanded) {
                _localValue = Map.from(widget.setting.value);
              }
            });
          },
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0).copyWith(top: 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ..._localValue.entries.map((entry) {
                    return _buildField(
                      entry.key,
                      entry.value,
                      (newValue) {
                        setState(() {
                          _localValue[entry.key] = newValue;
                        });
                      },
                    );
                  }),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _isSaving
                        ? null
                        : () async {
                            setState(() {
                              _isSaving = true;
                            });
                            try {
                              await ref
                                  .read(adminSettingsProvider.notifier)
                                  .updateSetting(widget.setting.key, _localValue);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Settings saved successfully')),
                                );
                                setState(() {
                                  _isExpanded = false;
                                });
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Error saving: $e'),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            } finally {
                              if (mounted) {
                                setState(() {
                                  _isSaving = false;
                                });
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.background,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: AppColors.background,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildField(String key, dynamic value, Function(dynamic) onChanged) {
    if (value is bool) {
      return SwitchListTile(
        title: Text(_formatKey(key), style: const TextStyle(color: AppColors.foreground)),
        value: value,
        activeTrackColor: AppColors.primary,
        onChanged: onChanged,
        contentPadding: EdgeInsets.zero,
      );
    } else if (value is String) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16.0),
        child: TextFormField(
          initialValue: value,
          onChanged: onChanged,
          maxLines: value.length > 50 ? 3 : 1,
          style: const TextStyle(color: AppColors.foreground),
          decoration: InputDecoration(
            labelText: _formatKey(key),
            labelStyle: const TextStyle(color: AppColors.foregroundMuted),
            enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.border)),
            focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.primary)),
            fillColor: AppColors.backgroundSubtle,
            filled: true,
          ),
        ),
      );
    } else if (value is num) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16.0),
        child: TextFormField(
          initialValue: value.toString(),
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          onChanged: (val) {
            final parsed = num.tryParse(val);
            if (parsed != null) {
              onChanged(parsed);
            }
          },
          style: const TextStyle(color: AppColors.foreground),
          decoration: InputDecoration(
            labelText: _formatKey(key),
            labelStyle: const TextStyle(color: AppColors.foregroundMuted),
            enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.border)),
            focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AppColors.primary)),
            fillColor: AppColors.backgroundSubtle,
            filled: true,
          ),
        ),
      );
    } else {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16.0),
        child: Text(
          '${_formatKey(key)}: [Complex Object]',
          style: const TextStyle(color: AppColors.foregroundMuted),
        ),
      );
    }
  }

  String _formatKey(String key) {
    return key
        .split('_')
        .map((word) => word.isNotEmpty ? '\${word[0].toUpperCase()}\${word.substring(1)}' : '')
        .join(' ');
  }
}
