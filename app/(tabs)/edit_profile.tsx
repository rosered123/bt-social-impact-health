import { Feather } from '@expo/vector-icons';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  getAllTags,
  getBusinessByUid,
  getBusinessTags,
  getMyProfile,
  setMyBusinessTags,
  updateMyProfile,
  upsertMyBusiness,
  type VibeTag,
} from '@/services/api';
import { notifyProfileChanged } from '@/services/refresh-bus';

export default function EditProfile() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const goBack = () => {
    if (from === 'profile') {
      router.replace('/business_profile');
    } else if (from === 'dashboard') {
      router.replace('/dashboard');
    } else {
      router.back();
    }
  };
  const [businessName, setBusinessName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [story, setStory] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [popularTags, setPopularTags] = useState<VibeTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (!profile || cancelled) return;
        setLocation(profile.location ?? '');
        const [biz, tags, bizTags] = await Promise.all([
          getBusinessByUid(profile.uid),
          getAllTags(),
          getBusinessTags(profile.uid),
        ]);
        if (cancelled) return;
        if (biz) {
          setBusinessName(biz.business_name ?? '');
          setShortDescription(biz.short_description ?? '');
          setEmail(biz.email ?? '');
          setPhone(biz.phone ?? '');
          setWebsite(biz.website ?? '');
          setStory(biz.story ?? '');
          setLogoUrl(biz.logo_url ?? null);
        }
        setPopularTags(tags);
        setVibeTags(bizTags.map(t => t.name));
      } catch {
        // show empty form on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !vibeTags.includes(tag)) {
      setVibeTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  };

  const removeTag = (index: number) => {
    setVibeTags(prev => prev.filter((_, i) => i !== index));
  };

  const addPopularTag = (tag: string) => {
    if (!vibeTags.includes(tag)) setVibeTags(prev => [...prev, tag]);
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required', 'Business name is required.');
      return;
    }
    setSaving(true);
    try {
      // Resolve tag names to IDs (only tags that exist in the vibe_tags table)
      const tagIds = vibeTags
        .map(name => popularTags.find(t => t.name === name)?.id)
        .filter((id): id is number => id != null);

      await Promise.all([
        upsertMyBusiness({
          business_name: businessName.trim(),
          short_description: shortDescription.trim() || null,
          story: story.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
        }),
        updateMyProfile({ location: location.trim() || null }),
        setMyBusinessTags(tagIds),
      ]);
      notifyProfileChanged();
      setSaving(false);
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => setTimeout(goBack, 0) },
      ]);
      return;
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Header (golden gradient) ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Business Profile</Text>
        </View>
        <TouchableOpacity style={[styles.saveHeaderBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveHeaderText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Cover Photo + Avatar ── */}
        <View style={styles.coverSection}>
          <View style={styles.coverPhoto}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <TouchableOpacity style={styles.coverBtn} activeOpacity={0.8}>
              <Feather name="camera" size={14} color="#fff" />
              <Text style={styles.coverBtnText}>Change Cover Photo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 22, opacity: 0.5 }}>🖼</Text>
              )}
              <View style={styles.avatarCameraBadge}>
                <Feather name="camera" size={10} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        {/* ── Card: Business Info ── */}
        <View style={styles.card}>
          <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Type Name..." placeholderTextColor="#999" value={businessName} onChangeText={setBusinessName} />

          <Text style={styles.label}>About/Short Description <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Type description..." placeholderTextColor="#999" value={shortDescription} onChangeText={text => { if (text.length <= 100) setShortDescription(text); }} maxLength={100} />
          <Text style={styles.charCount}>{shortDescription.length}/100 characters</Text>

          <Text style={styles.label}>Your Story</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Type description..." placeholderTextColor="#999" value={story} onChangeText={setStory} multiline textAlignVertical="top" />
          <Text style={styles.helperText}>Share what makes your business special</Text>
        </View>

        {/* ── Card: Contact Information ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="Type Location..." placeholderTextColor="#999" value={location} onChangeText={setLocation} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} placeholder="(123) 456-7890" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Website</Text>
          <TextInput style={styles.input} placeholder="Type Website..." placeholderTextColor="#999" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="business@gmail.com" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          {/* Social media icons */}
          <View style={styles.socialRow}>
            <Feather name="instagram" size={20} color="#333" />
            <Feather name="facebook" size={20} color="#333" />
            <Feather name="music" size={20} color="#333" />
          </View>
        </View>

        {/* ── Card: Vibe Tags ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vibe Tags</Text>
          <View style={styles.tagsContainer}>
            {vibeTags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag} onPress={() => removeTag(index)}>
                <Text style={styles.tagText}>{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>Select from popular tags:</Text>
          <View style={styles.tagsContainer}>
            {popularTags
              .filter(tag => !vibeTags.includes(tag.name))
              .map(tag => (
                <TouchableOpacity key={tag.id} style={styles.popularTag} onPress={() => addPopularTag(tag.name)}>
                  <Text style={styles.popularTagText}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
          </View>

          <Text style={styles.subLabel}>Add custom tag:</Text>
          <View style={styles.customTagRow}>
            <TextInput style={[styles.input, styles.customTagInput]} placeholder="Enter custom tag..." placeholderTextColor="#999" value={customTag} onChangeText={setCustomTag} onSubmitEditing={addCustomTag} />
            <TouchableOpacity style={styles.addTagBtn} onPress={addCustomTag}>
              <Text style={styles.addTagBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Save Changes ── */}
        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const RADIUS = 12;
const BLUE = '#2E4A7A';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#FFF1AD',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  backBtn: { marginRight: 10 },
  backIcon: { fontSize: 24, fontWeight: '700', color: '#111' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', flexShrink: 1 },
  saveHeaderBtn: {
    backgroundColor: BLUE, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  saveHeaderText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },

  // Cover photo + avatar
  coverSection: { marginTop: 16, marginBottom: 16 },
  coverPhoto: {
    height: 140, backgroundColor: '#FFFFFF', borderRadius: RADIUS,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  coverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(46,74,122,0.75)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  coverBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  avatarWrapper: { marginTop: -30, marginLeft: 12 },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#d0d0d0',
    borderWidth: 3, borderColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'visible',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 30 },
  avatarCameraBadge: {
    position: 'absolute', bottom: -2, right: -6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#f5f5f5',
  },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS, padding: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },

  // Form fields
  label: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 6, marginTop: 12 },
  required: { color: '#e53e3e' },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, color: '#111',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 110, paddingTop: 12, borderRadius: RADIUS, textAlignVertical: 'top' },
  helperText: { fontSize: 12, color: '#888', marginTop: 4 },
  charCount: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'right' },
  subLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 14, marginBottom: 8 },

  // Social icons
  socialRow: { flexDirection: 'row', gap: 16, marginTop: 14 },

  // Tags
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: {
    backgroundColor: '#FFF1AD', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FFF1AD',
  },
  tagText: { color: '#333', fontSize: 13, fontWeight: '600' },
  popularTag: {
    backgroundColor: '#FFF1AD', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FFF1AD',
  },
  popularTagText: { color: '#555', fontSize: 13, fontWeight: '600' },

  // Custom tag
  customTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customTagInput: { flex: 1, marginTop: 0 },
  addTagBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: BLUE, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  addTagBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Save button
  saveBtn: {
    backgroundColor: BLUE, borderRadius: 28,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
