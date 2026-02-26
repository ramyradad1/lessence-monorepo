import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_models.dart';
import 'auth_provider.dart';
import '../utils/fetch_logger.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(supabaseClientProvider));
});

class ProfileRepository {
  ProfileRepository(this._supabase);
  final SupabaseClient _supabase;

  Future<Map<String, dynamic>?> fetchProfile(String userId) async {
    final response = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    return response == null ? null : Map<String, dynamic>.from(response as Map);
  }

  Future<List<Map<String, dynamic>>> fetchAddresses(String userId) async {
    final response = await _supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', ascending: false)
        .order('created_at', ascending: false)
        .executeAndLog('ProfileRepository:fetchAddresses');

    return (response as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList(growable: false);
  }

  Future<void> updateProfile(
    String userId,
    Map<String, dynamic> updates,
  ) async {
    await _supabase.from('profiles').update(updates).eq('id', userId);
  }

  Future<void> clearDefaultAddresses(String userId) async {
    await _supabase
        .from('addresses')
        .update(<String, dynamic>{'is_default': false})
        .eq('user_id', userId);
  }

  Future<void> insertAddress(Map<String, dynamic> address) async {
    await _supabase.from('addresses').insert(address);
  }

  Future<void> updateAddress(
    String addressId,
    String userId,
    Map<String, dynamic> updates,
  ) async {
    await _supabase
        .from('addresses')
        .update(updates)
        .eq('id', addressId)
        .eq('user_id', userId);
  }

  Future<void> deleteAddress(String addressId, String userId) async {
    await _supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);
  }
}

final profileControllerProvider =
    NotifierProvider<ProfileController, ProfileFeatureState>(
      ProfileController.new,
    );

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

class ProfileController extends Notifier<ProfileFeatureState> {
  StreamSubscription<AuthState>? _authSubscription;

  SupabaseClient get _supabase => ref.read(supabaseClientProvider);
  ProfileRepository get _repository => ref.read(profileRepositoryProvider);

  @override
  ProfileFeatureState build() {
    _authSubscription?.cancel();
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      (event) => _handleAuth(event.session?.user),
    );
    ref.onDispose(() {
      _authSubscription?.cancel();
    });
    Future.microtask(() => _handleAuth(_supabase.auth.currentUser));
    return ProfileFeatureState.empty;
  }

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
      final profileMap = await _repository.fetchProfile(user.id);

      final profile = profileMap != null
          ? AppProfile.fromMap(profileMap)
          : _fallbackProfileFromUser(user);

      final addressesResult = await _repository.fetchAddresses(user.id);

      final addresses = addressesResult
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
      await _repository.updateProfile(user.id, <String, dynamic>{
        'full_name': fullName.trim().isEmpty ? null : fullName.trim(),
        'phone': phone.trim().isEmpty ? null : phone.trim(),
      });

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
        await _repository.clearDefaultAddresses(user.id);
      }

      if (addressId == null) {
        await _repository.insertAddress(draft.toInsertMap(user.id));
      } else {
        await _repository.updateAddress(
          addressId,
          user.id,
          draft.toUpdateMap(),
        );
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
      await _repository.deleteAddress(addressId, user.id);
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
}
