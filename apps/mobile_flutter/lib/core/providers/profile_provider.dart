import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';

final profileControllerProvider =
    StateNotifierProvider<ProfileController, ProfileFeatureState>((ref) {
      return ProfileController(ref);
    });

class ProfileFeatureState {
  const ProfileFeatureState({
    this.isLoading = false,
    this.isSaving = false,
    this.profile,
    this.profileRowExists = false,
    this.addresses = const <AddressModel>[],
    this.errorMessage,
  });

  final bool isLoading;
  final bool isSaving;
  final AppProfile? profile;
  final bool profileRowExists;
  final List<AddressModel> addresses;
  final String? errorMessage;

  ProfileFeatureState copyWith({
    bool? isLoading,
    bool? isSaving,
    AppProfile? profile,
    bool clearProfile = false,
    bool? profileRowExists,
    List<AddressModel>? addresses,
    String? errorMessage,
    bool clearError = false,
  }) {
    return ProfileFeatureState(
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      profile: clearProfile ? null : (profile ?? this.profile),
      profileRowExists: profileRowExists ?? this.profileRowExists,
      addresses: addresses ?? this.addresses,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  static const empty = ProfileFeatureState();
}

class ProfileController extends StateNotifier<ProfileFeatureState> {
  ProfileController(this._ref) : super(ProfileFeatureState.empty) {
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      (event) => _handleAuth(event.session?.user),
    );
    _handleAuth(_supabase.auth.currentUser);
  }

  final Ref _ref;
  late final SupabaseClient _supabase = _ref.read(supabaseClientProvider);
  StreamSubscription<AuthState>? _authSubscription;

  Future<void> _handleAuth(User? user) async {
    if (user == null) {
      state = ProfileFeatureState.empty;
      return;
    }
    await refresh();
  }

  Future<void> refresh() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      state = ProfileFeatureState.empty;
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final profileResult = await _supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      final profileMap = profileResult == null
          ? null
          : Map<String, dynamic>.from(profileResult as Map);
      final profile = profileMap != null
          ? AppProfile.fromMap(profileMap)
          : _fallbackProfileFromUser(user);

      final addressesResult = await _supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', ascending: false)
          .order('created_at', ascending: false);

      final addresses = (addressesResult as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(AddressModel.fromMap)
          .toList(growable: false);

      state = state.copyWith(
        isLoading: false,
        isSaving: false,
        profile: profile,
        profileRowExists: profileMap != null,
        addresses: addresses,
        clearError: true,
      );
    } on PostgrestException catch (error) {
      state = state.copyWith(
        isLoading: false,
        isSaving: false,
        errorMessage: error.message,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        isSaving: false,
        errorMessage: 'Failed to load profile',
      );
    }
  }

  Future<void> updateProfile({
    required String fullName,
    required String phone,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    state = state.copyWith(isSaving: true, clearError: true);
    try {
      await _supabase
          .from('profiles')
          .update(<String, dynamic>{
            'full_name': fullName.trim().isEmpty ? null : fullName.trim(),
            'phone': phone.trim().isEmpty ? null : phone.trim(),
          })
          .eq('id', user.id);

      await refresh();
    } on PostgrestException catch (error) {
      state = state.copyWith(isSaving: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Failed to update profile',
      );
    }
  }

  Future<void> saveAddress(AddressDraft draft, {String? addressId}) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    state = state.copyWith(isSaving: true, clearError: true);

    try {
      if (draft.isDefault) {
        await _supabase
            .from('addresses')
            .update(<String, dynamic>{'is_default': false})
            .eq('user_id', user.id);
      }

      if (addressId == null) {
        await _supabase.from('addresses').insert(draft.toInsertMap(user.id));
      } else {
        await _supabase
            .from('addresses')
            .update(draft.toUpdateMap())
            .eq('id', addressId)
            .eq('user_id', user.id);
      }

      await refresh();
    } on PostgrestException catch (error) {
      state = state.copyWith(isSaving: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Failed to save address',
      );
    }
  }

  Future<void> deleteAddress(String addressId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    state = state.copyWith(isSaving: true, clearError: true);
    try {
      await _supabase
          .from('addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', user.id);
      await refresh();
    } on PostgrestException catch (error) {
      state = state.copyWith(isSaving: false, errorMessage: error.message);
    } catch (_) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Failed to delete address',
      );
    }
  }

  AppProfile _fallbackProfileFromUser(User user) {
    final metadata = Map<String, dynamic>.from(
      user.userMetadata ?? const <String, dynamic>{},
    );
    return AppProfile(
      id: user.id,
      email: user.email ?? '',
      fullName: metadata['full_name'] as String?,
      phone: metadata['phone'] as String?,
    );
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
