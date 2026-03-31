import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

type UserType = 'consumer' | 'business';

function destinationForRole(role: 'customer' | 'business' | null) {
  return role === 'business' ? '/(tabs)/dashboard' : '/(tabs)/explore';
}

export default function AuthScreen() {
  const { session, role, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<UserType>('consumer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');

  const dbRole = useMemo(() => (userType === 'business' ? 'business' : 'customer'), [userType]);

  if (session && !loading) {
    return <Redirect href={destinationForRole(role)} />;
  }

  const submit = async () => {
    setErrorText('');
    setInfoText('');

    if (!email.trim() || !password.trim()) {
      setErrorText('Please enter email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorText('Please add your name for signup.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        router.replace('/(tabs)');
      } else {
        const { requiresEmailConfirmation } = await signUp(
          email.trim(),
          password,
          dbRole,
          name.trim()
        );

        if (requiresEmailConfirmation) {
          setInfoText('Check your email to confirm your account, then login.');
          setMode('login');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      setErrorText(error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Pop-Ups</Text>
          <Text style={styles.subtitle}>Login or create an account by selecting your user type.</Text>

          <View style={styles.rowToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, mode === 'login' && styles.toggleButtonActive]}
              onPress={() => setMode('login')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, mode === 'signup' && styles.toggleButtonActive]}
              onPress={() => setMode('signup')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, userType === 'consumer' && styles.toggleButtonActive]}
              onPress={() => setUserType('consumer')}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.toggleText, userType === 'consumer' && styles.toggleTextActive]}
              >
                Consumer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, userType === 'business' && styles.toggleButtonActive]}
              onPress={() => setUserType('business')}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.toggleText, userType === 'business' && styles.toggleTextActive]}
              >
                Business
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'signup' && (
            <TextInput
              placeholder="Name"
              placeholderTextColor="#9ba0a6"
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9ba0a6"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ba0a6"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          {infoText ? <Text style={styles.infoText}>{infoText}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submit}
            disabled={submitting || loading}
            activeOpacity={0.85}
          >
            {submitting || loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  rowToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  toggleButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  toggleText: {
    color: '#374151',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
  },
  infoText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});