import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';

import { createMyEvent } from '@/services/api';

interface VibeTag { id: string; label: string }

interface CheckboxRowProps { label: string; checked: boolean; onToggle: () => void }

const CheckboxRow: React.FC<CheckboxRowProps> = ({ label, checked, onToggle }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.75}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const SectionCard: React.FC<{ children: React.ReactNode; style?: object }> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const NOTIFICATION_OPTIONS = [
  'Notify my followers',
  'Show on map & explore page',
  'Generate sharable event',
];

export default function CreateEvent() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const goBack = () => {
    if (from === 'events') {
      router.replace('/buisness_events');
    } else if (from === 'dashboard') {
      router.replace('/dashboard');
    } else {
      router.back();
    }
  };
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    'Notify my followers': true,
    'Show on map & explore page': true,
    'Generate sharable event': true,
  });
  const [submitting, setSubmitting] = useState(false);

  const geocodeLocation = async (address: string) => {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const results = await Location.geocodeAsync(address.trim());
      if (results.length > 0) {
        setLatitude(results[0].latitude);
        setLongitude(results[0].longitude);
      }
    } catch {
      // Silently fail — event will save without coordinates
    } finally {
      setGeocoding(false);
    }
  };

  const removeTag = (id: string) => setVibeTags(prev => prev.filter(t => t.id !== id));

  const addTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    setVibeTags(prev => [...prev, { id: Date.now().toString(), label: trimmed }]);
    setCustomTag('');
  };

  const toggleNotification = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submit = async (publish: boolean) => {
    if (!eventName.trim()) {
      Alert.alert('Required', 'Event name is required.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Required', 'Date is required.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required', 'Location is required.');
      return;
    }
    setSubmitting(true);
    try {
      await createMyEvent({
        event_name: eventName.trim(),
        description: description.trim() || null,
        event_date: date.trim(),
        start_time: startTime.trim() || null,
        end_time: endTime.trim() || null,
        location: location.trim(),
        latitude,
        longitude,
        status: 'upcoming',
        is_published: publish,
      });
      Alert.alert('Success', publish ? 'Event created!' : 'Draft saved!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF14D" />

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Create Event</Text>
        <TouchableOpacity style={[styles.saveDraftBtn, submitting && { opacity: 0.5 }]} onPress={() => submit(false)} disabled={submitting}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.coverPhotoBox} activeOpacity={0.75}>
          <Text style={styles.coverPhotoIcon}>🖼</Text>
          <Text style={styles.coverPhotoText}>Add event cover photo</Text>
        </TouchableOpacity>

        <SectionCard>
          <Text style={styles.fieldLabel}>Event Name <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Type Name..." placeholderTextColor="#aaa" value={eventName} onChangeText={setEventName} />
        </SectionCard>

        <SectionCard>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Type description..." placeholderTextColor="#aaa" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
        </SectionCard>

        <SectionCard>
          <Text style={styles.fieldLabel}>Date <Text style={styles.required}>*</Text></Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateIcon}>📅</Text>
            <TextInput style={styles.dateInput} placeholder="mm/dd/yyyy" placeholderTextColor="#aaa" value={date} onChangeText={setDate} />
          </View>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Start time <Text style={styles.required}>*</Text></Text>
              <View style={styles.timeInputRow}>
                <Text style={styles.timeIcon}>🕐</Text>
                <TextInput style={styles.timeInput} placeholder="--:-- --" placeholderTextColor="#aaa" value={startTime} onChangeText={setStartTime} />
              </View>
            </View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>End time <Text style={styles.required}>*</Text></Text>
              <View style={styles.timeInputRow}>
                <Text style={styles.timeIcon}>🕐</Text>
                <TextInput style={styles.timeInput} placeholder="--:-- --" placeholderTextColor="#aaa" value={endTime} onChangeText={setEndTime} />
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.locationLabelRow}>
            <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Location <Text style={styles.required}>*</Text></Text>
            {geocoding && <Text style={styles.geocodingText}>Finding coordinates…</Text>}
            {!geocoding && latitude !== null && <Text style={styles.geocodedText}>📌 Located</Text>}
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Enter venue or address..."
              placeholderTextColor="#aaa"
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                setLatitude(null);
                setLongitude(null);
              }}
              onBlur={() => geocodeLocation(location)}
              returnKeyType="done"
            />
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.fieldLabel}>Vibe Tags</Text>
          <View style={styles.tagsWrap}>
            {vibeTags.map(tag => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.label}</Text>
                <TouchableOpacity onPress={() => removeTag(tag.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <Text style={styles.customTagLabel}>Add custom tag:</Text>
          <View style={styles.customTagRow}>
            <TextInput style={styles.customTagInput} placeholder="Enter custom tag..." placeholderTextColor="#aaa" value={customTag} onChangeText={setCustomTag} onSubmitEditing={addTag} returnKeyType="done" />
            <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
              <Text style={styles.addTagBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            {NOTIFICATION_OPTIONS.map(opt => (
              <CheckboxRow key={opt} label={opt} checked={notifications[opt]} onToggle={() => toggleNotification(opt)} />
            ))}
          </View>
        </SectionCard>

        <TouchableOpacity style={[styles.createBtn, submitting && { opacity: 0.5 }]} onPress={() => submit(true)} activeOpacity={0.85} disabled={submitting}>
          <Text style={styles.createBtnText}>{submitting ? 'Creating…' : 'Create event'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF14D' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  saveDraftBtn: { backgroundColor: '#85E4FF', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveDraftText: { color: '#07345F', fontWeight: '700', fontSize: 13 },
  coverPhotoBox: { borderWidth: 2, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, marginBottom: 14, backgroundColor: CARD_BG },
  coverPhotoIcon: { fontSize: 28, marginBottom: 6 },
  coverPhotoText: { fontSize: 13, color: '#666', fontWeight: '500' },
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 8 },
  required: { color: '#ef4444' },
  input: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  dateIcon: { fontSize: 15, marginRight: 6 },
  dateInput: { flex: 1, fontSize: 13, color: '#333' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 8, paddingVertical: 8 },
  timeIcon: { fontSize: 13, marginRight: 4 },
  timeInput: { flex: 1, fontSize: 12, color: '#333' },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  geocodingText: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  geocodedText: { fontSize: 11, color: '#22c55e', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 10, paddingVertical: 10 },
  locationIcon: { fontSize: 15, marginRight: 6 },
  locationInput: { flex: 1, fontSize: 13, color: '#333' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#ccc', paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, color: '#333' },
  tagRemove: { fontSize: 16, color: '#888', lineHeight: 18 },
  customTagLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  customTagRow: { flexDirection: 'row', gap: 8 },
  customTagInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#333' },
  addTagBtn: { backgroundColor: '#85E4FF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  addTagBtnText: { color: '#07345F', fontWeight: '700', fontSize: 13 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#999', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#222', borderColor: '#222' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  checkboxLabel: { flex: 1, fontSize: 13, color: '#333' },
  createBtn: { backgroundColor: '#07345F', borderRadius: RADIUS, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
