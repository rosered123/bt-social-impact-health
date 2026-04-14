import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';

import { createMyEvent, getAllTags, getEventById, updateMyEvent } from '@/services/api';
import type { VibeTag } from '@/services/api';
import { notifyEventsChanged } from '@/services/refresh-bus';

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

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM',
];

const TimePicker: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timePickerWrapper}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TouchableOpacity style={styles.timePickerBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.timePickerValue}>{value || '--:-- --'}</Text>
        <Text style={styles.timePickerChevron}>▼</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.timeDropdown}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity key={t} style={[styles.timeOption, t === value && styles.timeOptionSelected]} onPress={() => { onChange(t); setOpen(false); }}>
                <Text style={[styles.timeOptionText, t === value && styles.timeOptionTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const NOTIFICATION_OPTIONS = [
  'Notify my followers',
  'Show on map & explore page',
  'Generate sharable event',
];

export default function CreateEvent() {
  const { from, eventId } = useLocalSearchParams<{ from?: string; eventId?: string }>();
  const editingId = eventId ? Number(eventId) : null;
  const isEditing = editingId !== null && !Number.isNaN(editingId);

  const goBack = () => {
    // When editing an existing event, always pop back so the previous screen's
    // useFocusEffect re-runs and shows the updated data.
    if (isEditing) {
      if (router.canGoBack()) {
        router.back();
      } else if (from === 'drafts') {
        router.replace('/buisness_events_drafts');
      } else {
        router.replace('/buisness_events');
      }
      return;
    }
    if (from === 'events') {
      router.replace('/buisness_events');
    } else if (from === 'dashboard') {
      router.replace('/dashboard');
    } else if (from === 'drafts') {
      router.replace('/buisness_events_drafts');
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
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<VibeTag[]>([]);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    'Notify my followers': true,
    'Show on map & explore page': true,
    'Generate sharable event': true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(isEditing);

  useEffect(() => {
    if (!isEditing || editingId === null) return;
    let cancelled = false;
    (async () => {
      try {
        const evt = await getEventById(editingId);
        if (cancelled || !evt) return;
        setEventName(evt.event_name ?? '');
        setDescription(evt.description ?? '');
        setDate(evt.event_date ?? '');
        setStartTime(evt.start_time ?? '');
        setEndTime(evt.end_time ?? '');
        setLocation(evt.location ?? '');
        setLatitude(evt.latitude);
        setLongitude(evt.longitude);
      } catch (e: any) {
        if (!cancelled) Alert.alert('Error', e.message ?? 'Failed to load event.');
      } finally {
        if (!cancelled) setLoadingEvent(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isEditing, editingId]);

  // Reset form to empty state when entering create mode (no eventId).
  // Handles cases where the screen was previously used for editing and
  // React kept the component instance alive.
  useEffect(() => {
    if (isEditing) return;
    setEventName('');
    setDescription('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setLatitude(null);
    setLongitude(null);
    setVibeTags([]);
    setCustomTag('');
    setNotifications({
      'Notify my followers': true,
      'Show on map & explore page': true,
      'Generate sharable event': true,
    });
  }, [isEditing]);

  useEffect(() => {
    let cancelled = false;
    getAllTags()
      .then(tags => { if (!cancelled) setPopularTags(tags); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const removeTag = (index: number) => setVibeTags(prev => prev.filter((_, i) => i !== index));

  const addTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !vibeTags.includes(trimmed)) {
      setVibeTags(prev => [...prev, trimmed]);
    }
    setCustomTag('');
  };

  const addPopularTag = (tag: string) => {
    if (!vibeTags.includes(tag)) setVibeTags(prev => [...prev, tag]);
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
      if (isEditing && editingId !== null) {
        // When editing, only update fields the user can actually change.
        // Don't overwrite status — keep whatever the event already has.
        const updatePayload = {
          event_name: eventName.trim(),
          description: description.trim() || null,
          event_date: date.trim(),
          start_time: startTime.trim() || null,
          end_time: endTime.trim() || null,
          location: location.trim(),
          latitude,
          longitude,
          is_published: publish,
        };
        await updateMyEvent(editingId, updatePayload);
      } else {
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
      }
      // Notify any listening screens (drafts list, events list, dashboard) that
      // events have changed so they refetch next time they render.
      notifyEventsChanged();
      setSubmitting(false);
      const successMsg = isEditing
        ? publish ? 'Event published!' : 'Draft updated!'
        : publish ? 'Event created!' : 'Draft saved!';
      // Save Draft always routes to the drafts list. Publish uses the normal
      // back behavior so the user returns to wherever they came from.
      const afterSubmit = () => {
        if (!publish) {
          router.replace('/buisness_events_drafts');
        } else {
          goBack();
        }
      };
      Alert.alert('Success', successMsg, [
        // setTimeout 0 ensures the Alert is fully dismissed before we navigate,
        // which avoids iOS timing quirks that can swallow the navigation call.
        { text: 'OK', onPress: () => setTimeout(afterSubmit, 0) },
      ]);
      return;
    } catch (e: any) {
      Alert.alert('Error', e.message ?? (isEditing ? 'Failed to update event.' : 'Failed to create event.'));
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
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
            <TimePicker label="Start time *" value={startTime} onChange={setStartTime} />
            <TimePicker label="End time *" value={endTime} onChange={setEndTime} />
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
            {vibeTags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag} onPress={() => removeTag(index)}>
                <Text style={styles.tagText}>{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.customTagLabel}>Select from popular tags:</Text>
          <View style={styles.tagsWrap}>
            {popularTags.map(tag => (
              <TouchableOpacity key={tag.id} style={styles.popularTag} onPress={() => addPopularTag(tag.name)}>
                <Text style={styles.popularTagText}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.customTagLabel, { marginTop: 10 }]}>Add custom tag:</Text>
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
          <Text style={styles.createBtnText}>
            {submitting
              ? isEditing ? 'Saving…' : 'Creating…'
              : isEditing ? 'Publish event' : 'Create event'}
          </Text>
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
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF1AD' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  saveDraftBtn: { backgroundColor: '#7AAED6', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveDraftText: { color: '#2E4A7A', fontWeight: '700', fontSize: 13 },
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
  timeLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
  timePickerWrapper: { flex: 1, zIndex: 10 },
  timePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 10, paddingVertical: 8 },
  timePickerValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  timePickerChevron: { fontSize: 10, color: '#666' },
  timeDropdown: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 8, zIndex: 100, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  timeOption: { paddingHorizontal: 12, paddingVertical: 9 },
  timeOptionSelected: { backgroundColor: '#f0f0f0' },
  timeOptionText: { fontSize: 13, color: '#333' },
  timeOptionTextSelected: { fontWeight: '700', color: '#111' },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  geocodingText: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  geocodedText: { fontSize: 11, color: '#22c55e', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 10, paddingVertical: 10 },
  locationIcon: { fontSize: 15, marginRight: 6 },
  locationInput: { flex: 1, fontSize: 13, color: '#333' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  tagText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  popularTag: { backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#ccc' },
  popularTagText: { color: '#555', fontSize: 13, fontWeight: '600' },
  customTagLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  customTagRow: { flexDirection: 'row', gap: 8 },
  customTagInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#333' },
  addTagBtn: { backgroundColor: '#7AAED6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  addTagBtnText: { color: '#2E4A7A', fontWeight: '700', fontSize: 13 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#999', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#222', borderColor: '#222' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  checkboxLabel: { flex: 1, fontSize: 13, color: '#333' },
  createBtn: { backgroundColor: '#2E4A7A', borderRadius: RADIUS, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
