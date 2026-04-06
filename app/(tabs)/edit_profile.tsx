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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  getAllTags,
  getBusinessByUid,
  getMyProfile,
  updateMyProfile,
  upsertMyBusiness,
  type VibeTag,
} from '@/services/api';

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
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [popularTags, setPopularTags] = useState<VibeTag[]>([]);
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (!profile || cancelled) return;
        setLocation(profile.location ?? '');
        const [biz, tags] = await Promise.all([getBusinessByUid(profile.uid), getAllTags()]);
        if (cancelled) return;
        if (biz) {
          setBusinessName(biz.business_name ?? '');
          setShortDescription(biz.short_description ?? '');
          setEmail(biz.email ?? '');
          setPhone(biz.phone ?? '');
          setWebsite(biz.website ?? '');
          setStory(biz.story ?? '');
        }
        setPopularTags(tags);
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
      ]);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile.');
    } finally {
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
        <TouchableOpacity style={[styles.saveHeaderBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveHeaderText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="Type Name..." placeholderTextColor="#999" value={businessName} onChangeText={setBusinessName} />

        <Text style={styles.label}>Short Description <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="Type description..." placeholderTextColor="#999" value={shortDescription} onChangeText={text => { if (text.length <= 100) setShortDescription(text); }} maxLength={100} />
        <Text style={styles.charCount}>{shortDescription.length}/100 characters</Text>

        <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} placeholder="Type Location..." placeholderTextColor="#999" value={location} onChangeText={setLocation} />

        <Text style={styles.sectionTitle}>Contact Information</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="business@gmail.com" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="(123) 456-7890" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Website</Text>
        <TextInput style={styles.input} placeholder="Type Website..." placeholderTextColor="#999" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" />

        <Text style={styles.sectionTitle}>Your Story</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Type description..." placeholderTextColor="#999" value={story} onChangeText={setStory} multiline textAlignVertical="top" />
        <Text style={styles.helperText}>Share what makes your business special</Text>

        <Text style={styles.sectionTitle}>Vibe Tags</Text>
        <View style={styles.tagsContainer}>
          {vibeTags.map((tag, index) => (
            <TouchableOpacity key={index} style={styles.tag} onPress={() => removeTag(index)}>
              <Text style={styles.tagText}>{tag} ×</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>Select from popular tags:</Text>
        <View style={styles.tagsContainer}>
          {popularTags.map(tag => (
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

        <Text style={styles.sectionTitle}>Social Media</Text>

        <Text style={styles.label}>Instagram</Text>
        <TextInput style={styles.input} placeholder="type..." placeholderTextColor="#999" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />

        <Text style={styles.label}>TikTok</Text>
        <TextInput style={styles.input} placeholder="type..." placeholderTextColor="#999" value={tiktok} onChangeText={setTiktok} autoCapitalize="none" />

        <Text style={styles.label}>Facebook</Text>
        <TextInput style={styles.input} placeholder="type..." placeholderTextColor="#999" value={facebook} onChangeText={setFacebook} autoCapitalize="none" />

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#f5f5f5' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  backBtn: { marginRight: 10 },
  backIcon: { fontSize: 24, fontWeight: '700', color: '#111' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', flexShrink: 1 },
  saveHeaderBtn: { backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  saveHeaderText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  saveBtnDisabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginTop: 24, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  required: { color: '#e53e3e' },
  subLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 14, marginBottom: 8 },
  helperText: { fontSize: 12, color: '#888', marginTop: 4 },
  charCount: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'right' },
  input: { backgroundColor: CARD_BG, borderRadius: RADIUS, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111' },
  textArea: { minHeight: 100, paddingTop: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  tagText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  popularTag: { backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#ccc' },
  popularTagText: { color: '#555', fontSize: 13, fontWeight: '600' },
  customTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customTagInput: { flex: 1, marginTop: 0 },
  addTagBtn: { backgroundColor: '#333', borderRadius: RADIUS, paddingHorizontal: 16, paddingVertical: 12 },
  addTagBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: '#333', borderRadius: RADIUS, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
