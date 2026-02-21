import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '@lessence/supabase';

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { signIn, signUp, isLoading } = useAuth();

  const handleSubmit = async () => {
    setErrorMsg('');
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setErrorMsg(error.message);
      else onLoginSuccess?.();
    } else {
      const { error } = await signUp(email, fullName, password);
      if (error) setErrorMsg(error.message);
      else onLoginSuccess?.();
    }
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background-dark"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="items-center mb-10">
          <Text className="font-display text-4xl text-white mb-2">L'ESSENCE</Text>
          <Text className="text-white/40 text-[10px] tracking-[2px] uppercase">
            {isLogin ? "Welcome Back" : "Discover the Collection"}
          </Text>
        </View>

        {errorMsg !== '' && (
          <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-6">
            <Text className="text-red-400 text-xs text-center">{errorMsg}</Text>
          </View>
        )}

        <View className="space-y-4 mb-6">
          {!isLogin && (
            <TextInput
              placeholder="FULL NAME"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={fullName}
              onChangeText={setFullName}
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs tracking-[1px] text-white"
            />
          )}

          <TextInput
            placeholder="EMAIL ADDRESS"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs tracking-[1px] text-white"
          />

          <TextInput
            placeholder="PASSWORD"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-xs tracking-[1px] text-white"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className={`w-full bg-primary py-4 rounded-full items-center ${isLoading ? 'opacity-50' : ''}`}
        >
          <Text className="text-black font-bold uppercase tracking-[2px] text-xs">
            {isLoading ? "Authenticating..." : isLogin ? "Sign In" : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
          className="mt-8 self-center"
        >
          <Text className="text-white/40 text-[10px] tracking-[1px] uppercase">
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
