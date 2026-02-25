import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

final authStateProvider = StreamProvider<AuthState>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return supabase.auth.onAuthStateChange;
});

final sessionProvider = Provider<Session?>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final authState = ref.watch(authStateProvider).value;
  return authState?.session ?? supabase.auth.currentSession;
});

final currentUserProvider = Provider<User?>((ref) {
  final session = ref.watch(sessionProvider);
  return session?.user;
});

final authNotifierProvider = Provider<AuthNotifier>((ref) {
  return AuthNotifier(ref.watch(supabaseClientProvider));
});

class AuthNotifier {
  final SupabaseClient _supabase;

  AuthNotifier(this._supabase);

  Future<void> signIn(String email, String password) async {
    await _supabase.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp(
    String email,
    String password, {
    String? fullName,
  }) {
    return _supabase.auth.signUp(
      email: email,
      password: password,
      data: <String, dynamic>{
        if (fullName != null && fullName.trim().isNotEmpty)
          'full_name': fullName.trim(),
      },
    );
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }
}
