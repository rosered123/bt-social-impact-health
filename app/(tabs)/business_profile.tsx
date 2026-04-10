import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useAuth } from '@/providers/auth-provider';
import {
  getBusinessByUid,
  getBusinessEvents,
  getMyProfile,
  isActiveEventStatus,
  listReviewsForBusiness,
  type Business,
  type EventRow,
  type ReviewRow,
} from '@/services/api';
import { onEventsChanged, onProfileChanged } from '@/services/refresh-bus';

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[{ fontSize: size }, i <= rating ? styles.starFilled : styles.starEmpty]}>
        ★
      </Text>
    ))}
  </View>
);

// ─── Review Item ──────────────────────────────────────────────────────────────
const ReviewItem: React.FC<{ review: ReviewRow }> = ({ review }) => {
  const initial = review.reviewer_uid.slice(0, 1).toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{initial}</Text>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewName}>Customer</Text>
          <StarRating rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      {review.body ? (
        <Text style={styles.reviewBody}>{review.body}</Text>
      ) : (
        <View style={styles.reviewLines}>
          <View style={styles.reviewLine} />
          <View style={[styles.reviewLine, { width: '65%' }]} />
        </View>
      )}
      <TouchableOpacity style={styles.replyBtn}>
        <Text style={styles.replyText}>↩  Reply</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; label: string; link?: boolean }> = ({ icon, label, link }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoLabel, link && styles.infoLabelLink]}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyProfile() {
  const { signOut } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      if (!profile) return;
      // Fetch more than we display so we can filter out currently-live,
      // closed, or cancelled events and still have 5 upcoming ones left.
      const [biz, evts, revs] = await Promise.all([
        getBusinessByUid(profile.uid),
        getBusinessEvents(profile.uid, 20),
        listReviewsForBusiness(profile.uid, 5),
      ]);
      setBusiness(biz);
      // Only show events that are actually upcoming — exclude ones that are
      // currently live (open / closing_soon / sold_out / paused), closed, or
      // cancelled.
      const upcoming = evts
        .filter(e => !isActiveEventStatus(e.status) && e.status !== 'closed' && e.status !== 'cancelled')
        .slice(0, 5);
      setEvents(upcoming);
      setReviews(revs);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refetch when profile or events are edited elsewhere.
  useEffect(() => {
    const offProfile = onProfileChanged(loadProfile);
    const offEvents = onEventsChanged(loadProfile);
    return () => {
      offProfile();
      offEvents();
    };
  }, [loadProfile]);

  const onSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch {
      // keep UX simple
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  const reviewCount = reviews.length;
  const avgRating = business?.avg_rating ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>My Profile</Text>

        {/* ── Cover + Avatar ── */}
        <View style={styles.coverSection}>
          <View style={styles.coverPhoto}>
            {business?.logo_url ? (
              <Image source={{ uri: business.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={styles.coverPhotoIcon}>🖼</Text>
            )}
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {business?.logo_url ? (
                <Image source={{ uri: business.logo_url }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarIcon}>🖼</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Business Info ── */}
        <View style={styles.profileInfo}>
          <Text style={styles.businessName}>{business?.business_name ?? 'No Business Set Up'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starFilled}>★</Text>
              <Text style={styles.ratingText}> {Number(avgRating).toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</Text>
            </View>
            <Text style={styles.followersText}>{business?.follower_count ?? 0} followers</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => router.push('/edit_profile?from=profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.followBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>About</Text>
          <Text style={styles.cardBody}>{business?.short_description ?? 'No description yet.'}</Text>

          {business?.story ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardSectionTitle}>Our Story</Text>
              <Text style={styles.cardBody}>{business.story}</Text>
            </>
          ) : null}

          <View style={styles.divider} />

          <MapView
            style={styles.locationMap}
            initialRegion={{ latitude: 30.2672, longitude: -97.7431, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
          >
            <Marker coordinate={{ latitude: 30.2672, longitude: -97.7431 }} />
          </MapView>

          {business?.phone ? <InfoRow icon="📞" label={business.phone} /> : null}
          {business?.email ? <InfoRow icon="✉️" label={business.email} /> : null}
          {business?.website ? <InfoRow icon="🌐" label={business.website} link /> : null}
        </View>

        {/* ── Upcoming Events ── */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events.</Text>
        ) : (
          events.map(event => (
            <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.8}>
              <View style={styles.eventThumb}>
                {event.cover_url ? (
                  <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.event_name}</Text>
                <View style={styles.eventMetaRow}>
                  <Text style={styles.eventMetaIcon}>📅</Text>
                  <Text style={styles.eventMetaText}>{event.event_date}</Text>
                </View>
                {event.location ? (
                  <View style={styles.eventMetaRow}>
                    <Text style={styles.eventMetaIcon}>📍</Text>
                    <Text style={styles.eventMetaText}>{event.location}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* ── Recent Reviews ── */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <View style={styles.reviewsRating}>
            <Text style={styles.starFilled}>★</Text>
            <Text style={styles.reviewsRatingText}> {Number(avgRating).toFixed(1)} ({reviewCount})</Text>
          </View>
        </View>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          reviews.map(review => (
            <ReviewItem key={review.id} review={review} />
          ))
        )}

        <TouchableOpacity style={styles.signOutButton} activeOpacity={0.85} onPress={onSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG = '#e8e8e8';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },

  pageTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 16, marginBottom: 14 },

  coverSection: { marginBottom: 0 },
  coverPhoto: {
    height: 150, backgroundColor: CARD_BG, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
  },
  coverPhotoIcon: { fontSize: 28, opacity: 0.5 },
  avatarWrapper: { marginTop: -36, marginLeft: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#d0d0d0',
    borderWidth: 3, borderColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 22, opacity: 0.5 },

  profileInfo: { paddingTop: 8, marginBottom: 16 },
  businessName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#444', fontWeight: '500' },
  followersText: { fontSize: 13, color: '#444', fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, backgroundColor: '#555', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    flex: 1, backgroundColor: '#555', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 16, marginBottom: 20 },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },

  locationMap: { height: 140, borderRadius: 10, marginTop: 6, marginBottom: 6, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  infoIcon: { fontSize: 15, width: 22 },
  infoLabel: { fontSize: 13, color: '#444' },
  infoLabelLink: { color: '#4f7df0', fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 12 },

  eventCard: {
    flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 12, marginBottom: 14, gap: 12, alignItems: 'center',
  },
  eventThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#c8c8c8', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 36 },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontSize: 14, fontWeight: '800', color: '#111' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaIcon: { fontSize: 12 },
  eventMetaText: { fontSize: 12, color: '#666' },

  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reviewsRating: { flexDirection: 'row', alignItems: 'center' },
  reviewsRatingText: { fontSize: 14, fontWeight: '700', color: '#333' },

  reviewItem: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#bbb',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewBody: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 10 },
  reviewLines: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  replyBtn: {},
  replyText: { fontSize: 13, color: '#555', fontWeight: '600' },

  signOutButton: {
    marginTop: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#111', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff',
  },
  signOutButtonText: { color: '#111', fontWeight: '700', fontSize: 14 },

  starsRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
  starFilled: { color: '#f59e0b', fontSize: 13 },
  starEmpty: { color: '#ddd', fontSize: 13 },
});
