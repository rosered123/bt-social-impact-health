import { Redirect, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import {
    getAllTags,
    setMyBusinessTags,
    setMyUserInterests,
    updateMyProfile,
    upsertMyBusiness,
    VibeTag,
} from '@/services/api';

type UserType = 'consumer' | 'business';
type AuthStep = 'welcome' | 'role' | 'login' | 'signup';

function destinationForRole(role: 'customer' | 'business' | null) {
  return role === 'business' ? '/(tabs)/dashboard' : '/(tabs)/explore';
}

export default function AuthScreen() {
  const { session, role, loading, signIn, signUp } = useAuth();
  const [step, setStep] = useState<AuthStep>('welcome');
  const [userType, setUserType] = useState<UserType>('consumer');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [businessShortDescription, setBusinessShortDescription] = useState('');
  const [businessStory, setBusinessStory] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');

  const [allTags, setAllTags] = useState<VibeTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');

  const dbRole = useMemo(() => (userType === 'business' ? 'business' : 'customer'), [userType]);

  if (session && !loading) {
    return <Redirect href={destinationForRole(role)} />;
  }

  useEffect(() => {
    let mounted = true;
    const loadTags = async () => {
      setLoadingTags(true);
      try {
        const tags = await getAllTags();
        if (mounted) {
          setAllTags(tags);
        }
      } catch {
        if (mounted) {
          setAllTags([]);
        }
      } finally {
        if (mounted) {
          setLoadingTags(false);
        }
      }
    };

    loadTags();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const finishOnboardingPersistence = async () => {
    if (userType === 'consumer') {
      await updateMyProfile({
        display_name: name.trim(),
        location: location.trim() || null,
        bio: bio.trim() || null,
      });
      await setMyUserInterests(selectedTags);
      return;
    }

    await updateMyProfile({
      display_name: name.trim(),
      location: location.trim() || null,
      bio: bio.trim() || null,
    });

    await upsertMyBusiness({
      business_name: businessName.trim(),
      short_description: businessShortDescription.trim() || null,
      story: businessStory.trim() || null,
      website: businessWebsite.trim() || null,
      phone: businessPhone.trim() || null,
      email: email.trim(),
    });

    await setMyBusinessTags(selectedTags);
  };

  const submit = async () => {
    setErrorText('');
    setInfoText('');

    if (!email.trim() || !password.trim()) {
      setErrorText('Please enter email and password.');
      return;
    }

    if (step === 'signup' && !name.trim()) {
      setErrorText('Please add your name for signup.');
      return;
    }

    if (step === 'signup' && userType === 'business' && !businessName.trim()) {
      setErrorText('Please add a business name.');
      return;
    }

    setSubmitting(true);

    try {
      if (step === 'login') {
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
          setInfoText('Account created. Confirm your email, then login to finish profile setup.');
          setStep('login');
        } else {
          await finishOnboardingPersistence();
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      setErrorText(error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetMessages = () => {
    setErrorText('');
    setInfoText('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {step === 'welcome' ? (
            <>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>Our logo</Text>
              </View>

              <Text style={styles.title}>Welcome to PopSpot</Text>
              <Text style={styles.subtitleCentered}>
                description/tagline/hook introduction for our app goes here
              </Text>

              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>◉ Discover Events</Text>
                <Text style={styles.featureBody}>Find local experiences tailored to your vibe.</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>♥ Save Favorites</Text>
                <Text style={styles.featureBody}>Bookmark the pop-ups you want to revisit.</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>▣ Manage your business</Text>
                <Text style={styles.featureBody}>Post events and keep your regulars in the loop.</Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>⤿ Collaborate</Text>
                <Text style={styles.featureBody}>Partner with others and grow your reach.</Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  resetMessages();
                  setStep('role');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>Get Started →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  resetMessages();
                  setStep('login');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>I already have an account</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {step === 'role' ? (
            <>
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => {
                  resetMessages();
                  setStep('welcome');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.title}>How will you use HotSpot?</Text>
              <Text style={styles.subtitle}>Choose your account type.</Text>

              <View style={styles.rolePanel}>
                <TouchableOpacity
                  style={[styles.roleCard, userType === 'consumer' && styles.roleCardActive]}
                  onPress={() => setUserType('consumer')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.roleIcon}>🧭</Text>
                  <Text style={styles.roleTitle}>Customer</Text>
                  <Text style={styles.roleSubtitle}>Discover and save events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, userType === 'business' && styles.roleCardActive]}
                  onPress={() => setUserType('business')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.roleIcon}>🏪</Text>
                  <Text style={styles.roleTitle}>Business</Text>
                  <Text style={styles.roleSubtitle}>Post and manage pop-ups</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  resetMessages();
                  setStep('signup');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  resetMessages();
                  setStep('login');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>I already have an account</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {(step === 'login' || step === 'signup') ? (
            <>
              <Text style={styles.title}>{step === 'login' ? 'Login' : 'Create Account'}</Text>
              <Text style={styles.subtitle}>
                {step === 'login'
                  ? 'Enter your email and password to continue.'
                  : `Creating a ${userType === 'business' ? 'business' : 'customer'} account.`}
              </Text>

              {step === 'signup' ? (
                <TextInput
                  placeholder="Name"
                  placeholderTextColor="#9ba0a6"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              ) : null}

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

              {step === 'signup' ? (
                <>
                  <TextInput
                    placeholder="Location"
                    placeholderTextColor="#9ba0a6"
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                  />

                  <TextInput
                    placeholder={userType === 'business' ? 'Owner bio' : 'Tell us about your tastes'}
                    placeholderTextColor="#9ba0a6"
                    style={[styles.input, styles.multilineInput]}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                  />

                  {userType === 'business' ? (
                    <>
                      <TextInput
                        placeholder="Business name"
                        placeholderTextColor="#9ba0a6"
                        style={styles.input}
                        value={businessName}
                        onChangeText={setBusinessName}
                      />
                      <TextInput
                        placeholder="Short description"
                        placeholderTextColor="#9ba0a6"
                        style={styles.input}
                        value={businessShortDescription}
                        onChangeText={setBusinessShortDescription}
                      />
                      <TextInput
                        placeholder="Business story"
                        placeholderTextColor="#9ba0a6"
                        style={[styles.input, styles.multilineInput]}
                        value={businessStory}
                        onChangeText={setBusinessStory}
                        multiline
                      />
                      <TextInput
                        placeholder="Phone"
                        placeholderTextColor="#9ba0a6"
                        style={styles.input}
                        value={businessPhone}
                        onChangeText={setBusinessPhone}
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        placeholder="Website"
                        placeholderTextColor="#9ba0a6"
                        style={styles.input}
                        value={businessWebsite}
                        onChangeText={setBusinessWebsite}
                        autoCapitalize="none"
                      />
                    </>
                  ) : null}

                  <Text style={styles.tagsLabel}>
                    {userType === 'business' ? 'Business tags' : 'Choose your interests'}
                  </Text>
                  {loadingTags ? <ActivityIndicator /> : null}
                  <View style={styles.tagsWrap}>
                    {allTags.map((tag) => {
                      const selected = selectedTags.includes(tag.id);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          style={[styles.tagChip, selected && styles.tagChipSelected]}
                          onPress={() => toggleTag(tag.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>{tag.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}

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
                  <Text style={styles.submitButtonText}>{step === 'login' ? 'Login' : 'Create Account'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  resetMessages();
                  setStep(step === 'login' ? 'welcome' : 'role');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
        </ScrollView>
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
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 15,
    backgroundColor: '#cfcfcf',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    color: '#111',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 18,
    color: '#1f1f1f',
  },
  subtitleCentered: {
    fontSize: 18,
    color: '#1f1f1f',
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#d0d0d0',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  featureBody: {
    fontSize: 16,
    color: '#1f1f1f',
    alignItems: 'center',
    textAlign: 'center',
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
  },
  rolePanel: {
    backgroundColor: '#cdcdcd',
    borderRadius: 15,
    padding: 14,
    gap: 10,
  },
  roleCard: {
    backgroundColor: '#b8b8b8',
    borderRadius: 12,
    padding: 12,
  },
  roleCardActive: {
    borderWidth: 2,
    borderColor: '#696969',
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 18,
    color: '#111',
    fontWeight: '600',
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b7b7b7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  tagsLabel: {
    marginTop: 4,
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: '#a8a8a8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#efefef',
  },
  tagChipSelected: {
    backgroundColor: '#696969',
    borderColor: '#696969',
  },
  tagChipText: {
    fontSize: 12,
    color: '#2a2a2a',
    fontWeight: '600',
  },
  tagChipTextSelected: {
    color: '#fff',
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
    backgroundColor: '#696969',
    borderRadius: 18,
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
    fontSize: 20,
    fontWeight: '500',
  },
  secondaryButton: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#8a8a8a',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
});