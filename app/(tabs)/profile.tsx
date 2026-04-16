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
  getFollowedBusinesses,
  getMyProfile,
  getMyReviews,
  updateMyProfile,
  type Business,
  type Profile,
  type ReviewRow,
} from '@/services/api';
import {
  getSavedEvents,
  onSavedEventsChanged,
  type SavedEvent,
} from '@/services/saved-events';

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
        <Text style={[styles.heart, { color: '#e03d3d' }]}>♥</Text>
      </View>
      <View style={styles.savedBody}>
        <Text style={styles.savedTitle} numberOfLines={1}>{event.event_name}</Text>
        <Text style={styles.savedMeta} numberOfLines={1}>{event.business_name}</Text>
        <Text style={styles.savedMeta} numberOfLines={1}>{event.event_date}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FollowedBusinessCard({ biz }: { biz: Business }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.savedCard}>
      <View style={styles.savedImageWrap}>
        {biz.logo_url ? (
          <Image source={{ uri: biz.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <Text style={styles.heart}>♥</Text>
      </View>
      <View style={styles.savedBody}>
        <Text style={styles.savedTitle}>{biz.business_name}</Text>
        {biz.short_description ? <Text style={styles.savedMeta}>{biz.short_description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text key={star} style={[styles.starText, { color: star <= rating ? '#f59e0b' : '#ddd' }]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ review, avatarUrl }: { review: ReviewRow; avatarUrl?: string | null }) {
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <View style={styles.reviewAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
        </View>
        <View style={styles.reviewMetaWrap}>
          <Text style={styles.reviewName}>Your review</Text>
          <Stars rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      {review.body ? (
        <Text style={styles.reviewBodyText}>{review.body}</Text>
      ) : (
        <>
          <View style={styles.reviewLineOne} />
          <View style={styles.reviewLineTwo} />
        </>
      )}
    </View>
  );
}

export default function Profile() {
  const { } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followed, setFollowed] = useState<Business[]>([]);
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
        setFollowed(bizList);
        setReviews(revList);
      } catch {
        // ignore — show whatever loaded
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
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      {/* Location edit modal */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {profile?.display_name ?? 'there'}!</Text>
            <TouchableOpacity style={styles.locationRow} onPress={openLocationModal} activeOpacity={0.7}>
              <Text style={styles.location}>{profile?.location ?? 'Set location'}</Text>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => router.navigate('/(tabs)/settings')} activeOpacity={0.7}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.headerAvatar} />
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Saved Events</Text>
        {savedEvents.length === 0 ? (
          <Text style={styles.emptyText}>No saved events yet. Tap ♥ on any event to save it.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedEventsRow}>
            {savedEvents.map(e => <SavedEventCard key={e.id} event={e} />)}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Following</Text>
        {followed.length === 0 ? (
          <Text style={styles.emptyText}>You're not following any businesses yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedEventsRow}>
            {followed.map(biz => <FollowedBusinessCard key={biz.uid} biz={biz} />)}
          </ScrollView>
        )}

        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Your Reviews</Text>
        </View>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>You haven't written any reviews yet.</Text>
        ) : (
          reviews.map(r => <ReviewCard key={r.id} review={r} avatarUrl={profile?.avatar_url} />)
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const CARD = '#f8f8f8';
const MID = '#d9d9d9';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 22, marginHorizontal: -16, paddingHorizontal: 16, backgroundColor: '#FFF1AD' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  location: { fontSize: 20, color: '#222' },
  editIcon: { fontSize: 16, color: '#222', padding: 4 },
  headerAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: MID, marginTop: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },
  savedEventsRow: { gap: 14, paddingBottom: 18, paddingRight: 4 },
  savedCard: { width: 260, backgroundColor: MID, borderRadius: 12, overflow: 'hidden' },
  savedImageWrap: { height: 138, backgroundColor: '#adadad', justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 12, paddingTop: 10 },
  savedImage: { ...StyleSheet.absoluteFillObject, backgroundColor: '#adadad' },
  heart: { fontSize: 24, color: '#111', zIndex: 1 },
  savedBody: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 3 },
  savedTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 2 },
  savedMeta: { fontSize: 13, color: '#1f1f1f' },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  reviewCard: { backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 35, height: 35, borderRadius: 18, backgroundColor: MID, marginRight: 10, overflow: 'hidden' },
  reviewMetaWrap: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 1 },
  reviewDate: { fontSize: 10, color: '#666' },
  starsRow: { flexDirection: 'row', gap: 1 },
  starText: { fontSize: 11 },
  reviewBodyText: { fontSize: 13, color: '#444', lineHeight: 18 },
  reviewLineOne: { height: 10, width: '82%', backgroundColor: '#6b6b6b', marginBottom: 5 },
  reviewLineTwo: { height: 10, width: '98%', backgroundColor: '#6b6b6b', marginBottom: 9 },
  signOutButton: { marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#111', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  signOutButtonText: { color: '#111', fontWeight: '700', fontSize: 14 },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18, color: '#111' },

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
