import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import {
  getBusinessTags,
  getFollowedBusinesses,
  getMyProfile,
  getMyReviews,
  updateMyProfile,
  type Business,
  type Profile,
  type ReviewRow,
  type VibeTag,
} from '@/services/api';
import {
  getSavedEvents,
  onSavedEventsChanged,
  type SavedEvent,
} from '@/services/saved-events';

function formatSavedDate(dateStr: string, startTime: string | null, endTime: string | null): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const datePart = `${mm}-${dd}-${yyyy}`;
  if (!startTime) return datePart;
  const fmt = (t: string) => {
    const [h] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12} ${period}`;
  };
  const end = endTime ? ` – ${fmt(endTime)}` : '';
  return `${datePart} | ${fmt(startTime)}${end}`;
}

function SavedEventCard({ event }: { event: SavedEvent }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.savedCard}
      onPress={() => router.push({ pathname: '/(tabs)/view_event', params: { eventId: String(event.id) } })}
    >
      <View style={styles.savedImageWrap}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
      </View>
      <View style={styles.savedBody}>
        <View style={styles.savedTitleRow}>
          <Text style={styles.savedTitle} numberOfLines={1}>{event.event_name}</Text>
          <Text style={styles.savedHeart}>♥</Text>
        </View>
        <Text style={styles.savedMeta} numberOfLines={1}>
          {formatSavedDate(event.event_date, event.start_time, event.end_time)}
        </Text>
        {event.location ? <Text style={styles.savedMeta} numberOfLines={1}>{event.location}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

type BusinessWithTags = Business & { tags: VibeTag[] };

function FollowedVendorRow({ biz }: { biz: BusinessWithTags }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.vendorRow}
      onPress={() => router.push({ pathname: '/(tabs)/user_business_profile', params: { businessUid: biz.uid } })}
    >
      <View style={styles.vendorLogo}>
        {biz.logo_url ? (
          <Image source={{ uri: biz.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
      </View>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{biz.business_name}</Text>
        <View style={styles.tagsWrap}>
          {biz.tags.map(tag => (
            <View key={tag.id} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag.name}</Text>
            </View>
          ))}
          {biz.tags.length === 0 && biz.short_description ? (
            biz.short_description.split(',').map((s, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{s.trim()}</Text>
              </View>
            ))
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text key={star} style={[styles.starText, { color: star <= rating ? '#111' : '#ccc' }]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ review, avatarUrl }: { review: ReviewRow; avatarUrl?: string | null }) {
  const date = new Date(review.created_at);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  const dateStr = `${mm}-${dd}-${yyyy}`;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <View style={styles.reviewAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewBizName}>{review.reviewer_display_name ?? 'You'}</Text>
          <Stars rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>{dateStr}</Text>
      </View>
      {review.body ? <Text style={styles.reviewBody}>{review.body}</Text> : null}
      <TouchableOpacity style={styles.replyRow} activeOpacity={0.7}>
        <Text style={styles.replyIcon}>↩</Text>
        <Text style={styles.replyText}>Reply</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Profile() {
  const { } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followed, setFollowed] = useState<BusinessWithTags[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>(getSavedEvents);
  const [loading, setLoading] = useState(true);
  const [locationModal, setLocationModal] = useState(false);
  const [locationDraft, setLocationDraft] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => onSavedEventsChanged(() => setSavedEvents(getSavedEvents())), []);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p || cancelled) return;
        setProfile(p);
        const [bizList, revList] = await Promise.all([getFollowedBusinesses(), getMyReviews()]);
        if (cancelled) return;
        const tagArrays = await Promise.all(bizList.map((b: Business) => getBusinessTags(b.uid)));
        if (cancelled) return;
        setFollowed(bizList.map((b: Business, i: number) => ({ ...b, tags: tagArrays[i] })));
        setReviews(revList);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  const openLocationModal = () => {
    setLocationDraft(profile?.location ?? '');
    setLocationModal(true);
  };

  const saveLocation = async () => {
    setSavingLocation(true);
    try {
      const updated = await updateMyProfile({ location: locationDraft.trim() || null });
      setProfile(updated);
      setLocationModal(false);
    } catch {
      Alert.alert('Error', 'Could not save location.');
    } finally {
      setSavingLocation(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#333" style={{ flex: 1, backgroundColor: '#FFF1AD' }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      <Modal visible={locationModal} transparent animationType="fade" onRequestClose={() => setLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Location</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Austin, TX"
              placeholderTextColor="#aaa"
              value={locationDraft}
              onChangeText={setLocationDraft}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setLocationModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, savingLocation && { opacity: 0.6 }]}
                onPress={saveLocation}
                disabled={savingLocation}
              >
                <Text style={styles.modalSaveText}>{savingLocation ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* Yellow header */}
        <View style={styles.yellowHeader}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Hello, {profile?.display_name ?? 'there'}!</Text>
              <TouchableOpacity style={styles.locationRow} onPress={openLocationModal} activeOpacity={0.7}>
                <Text style={styles.locationText}>{profile?.location ?? 'Set location'}</Text>
                <Text style={styles.editIcon}> ✎</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerRight}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} resizeMode="cover" />
              ) : (
                <View style={styles.headerAvatar} />
              )}
            </View>
          </View>
        </View>

        {/* White content area */}
        <View style={styles.contentArea}>

          <Text style={styles.sectionTitle}>Saved Events</Text>
          {savedEvents.length === 0 ? (
            <Text style={styles.emptyText}>No saved events yet. Tap ♥ on any event to save it.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRow}>
              {savedEvents.map(e => <SavedEventCard key={e.id} event={e} />)}
            </ScrollView>
          )}

          <Text style={styles.sectionTitle}>Vendors you follow</Text>
          {followed.length === 0 ? (
            <Text style={styles.emptyText}>You're not following any businesses yet.</Text>
          ) : (
            <View style={styles.vendorList}>
              {followed.map(biz => <FollowedVendorRow key={biz.uid} biz={biz} />)}
            </View>
          )}

          <Text style={styles.sectionTitle}>Your Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>You haven't written any reviews yet.</Text>
          ) : (
            reviews.map(r => <ReviewCard key={r.id} review={r} avatarUrl={profile?.avatar_url} />)
          )}

          <View style={{ height: 32 }} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  scroll: { flex: 1 },

  yellowHeader: {
    backgroundColor: '#FFF1AD',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 16, color: '#333' },
  editIcon: { fontSize: 14, color: '#333' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18, color: '#111' },
  headerAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#d9d9d9', overflow: 'hidden' },

  contentArea: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 22,
    flex: 1,
  },

  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 14 },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 20 },

  // Saved Events
  savedRow: { gap: 14, paddingBottom: 20, paddingRight: 4 },
  savedCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  savedImageWrap: { width: '100%', height: 150, backgroundColor: '#d9d9d9' },
  savedBody: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  savedTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  savedTitle: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1, marginRight: 6 },
  savedHeart: { fontSize: 20, color: '#111' },
  savedMeta: { fontSize: 12, color: '#555', marginBottom: 1 },

  // Vendors you follow
  vendorList: { marginBottom: 22 },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorLogo: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#d9d9d9', overflow: 'hidden', marginRight: 14 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 8 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { backgroundColor: '#dce9f5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagChipText: { fontSize: 12, color: '#2E4A7A', fontWeight: '600' },

  // Reviews
  reviewCard: {
    backgroundColor: '#ebebeb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#d9d9d9', overflow: 'hidden', marginRight: 10 },
  reviewMeta: { flex: 1 },
  reviewBizName: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 2 },
  reviewDate: { fontSize: 11, color: '#888' },
  starsRow: { flexDirection: 'row', gap: 2 },
  starText: { fontSize: 13 },
  reviewBody: { fontSize: 13, color: '#333', lineHeight: 18, marginBottom: 10 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  replyIcon: { fontSize: 13, color: '#555' },
  replyText: { fontSize: 13, color: '#555', fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 14 },
  modalInput: { borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#555' },
  modalSave: { flex: 1, backgroundColor: '#2E4A7A', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
