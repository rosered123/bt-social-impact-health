import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import {
  getMyProfile,
  getBusinessByUid,
  listMyEvents,
  listReviewsForBusiness,
  type Profile,
  type Business,
  type ReviewRow,
  type EventRow,
} from '@/services/api';
import { onEventsChanged } from '@/services/refresh-bus';

// ─── Icon placeholders ───────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = '#222' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    chart: '📊', people: '👥', events: '⚡', star: '⭐',
    calendar: '📅', handshake: '🤝', offer: '🎁', analytics: '📈',
    camera: '📷', chat: '💬', settings: '⚙️', wifi: '📡', eye: '👁', edit: '✏️',
    reply: '↩', 'star-filled': '★', 'star-empty': '☆',
  };
  return <Text style={{ fontSize: size }}>{icons[name] ?? '●'}</Text>;
};

const StarRating = ({ rating }: { rating: number }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>★</Text>
    ))}
  </View>
);

const StatCard = ({ icon, value, label, sub }: { icon: string; value: string; label: string; sub: string }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={22} color="#333" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statSub}>{sub}</Text>
  </View>
);

const ActionCard = ({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
    <Icon name={icon} size={22} color="#333" />
    <Text style={styles.actionLabel}>{label}</Text>
    <Text style={styles.actionSub}>{sub}</Text>
  </TouchableOpacity>
);

const ReviewItem = ({ review }: { review: ReviewRow }) => {
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>U</Text>
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
        <View style={styles.reviewBodyPlaceholder}>
          <View style={styles.reviewLine} />
          <View style={[styles.reviewLine, { width: '70%' }]} />
        </View>
      )}
    </View>
  );
};

export default function BusinessDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [liveEvent, setLiveEvent] = useState<EventRow | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const p = await getMyProfile();
      if (!p) return;
      setProfile(p);
      const [biz, events, revs] = await Promise.all([
        getBusinessByUid(p.uid),
        listMyEvents(100),
        listReviewsForBusiness(p.uid),
      ]);
      setBusiness(biz);
      setEventCount(events.length);
      const live = events.find(e => e.is_published && e.status === 'open') ?? null;
      setLiveEvent(live);
      setReviews(revs.slice(0, 3));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Refetch when any screen notifies that events changed.
  useEffect(() => {
    return onEventsChanged(() => {
      loadDashboard();
    });
  }, [loadDashboard]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  const businessName = business?.business_name ?? profile?.display_name ?? 'Business';
  const avgRating = business?.avg_rating != null ? Number(business.avg_rating).toFixed(1) : '—';
  const followerCount = business?.follower_count ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Business Dashboard</Text>
            <Text style={styles.headerTitle}>Hey, {businessName} 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}><Icon name="chat" size={18} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Icon name="settings" size={18} /></TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileAvatar}>
              <Icon name="camera" size={20} color="#666" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{businessName}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.starFilled}>★</Text>
                <Text style={styles.profileRating}> {avgRating}/5</Text>
                <Text style={styles.profileReviews}> ({reviews.length} reviews)</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push('/(tabs)/public_business_profile')}
            >
              <Icon name="eye" size={14} color="#333" />
              <Text style={styles.outlineBtnText}> View Public Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filledBtn} onPress={() => router.push('/(tabs)/edit_profile?from=dashboard')}>
              <Icon name="edit" size={14} color="#fff" />
              <Text style={styles.filledBtnText}> Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Right Now ── */}
        <Text style={styles.sectionTitle}>Right Now</Text>
        <View style={styles.rightNowCard}>
          <View style={styles.rightNowTopRow}>
            <Text style={styles.rightNowLabel}>CURRENT STATUS</Text>
            <TouchableOpacity
              style={styles.updateBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/update_status')}
            >
              <Text style={styles.updateBtnText}>Update</Text>
            </TouchableOpacity>
          </View>
          {liveEvent ? (
            <>
              <View style={styles.liveBadgeRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE NOW</Text>
              </View>
              <Text style={styles.rightNowDetail}>
                {liveEvent.event_name}{liveEvent.location ? `  |  ${liveEvent.location}` : ''}
              </Text>
            </>
          ) : (
            <Text style={styles.rightNowDetail}>No events right now</Text>
          )}
        </View>

        {/* ── Today's Activity ── */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.grid}>
          <StatCard icon="people" value={String(followerCount)} label="Followers" sub="" />
          <StatCard icon="events" value={String(eventCount)} label="My Events" sub="" />
          <StatCard icon="star" value={`${avgRating}/5`} label="Average Rating" sub={`${reviews.length} reviews`} />
        </View>

        {/* ── More Actions ── */}
        <Text style={styles.sectionTitle}>More Actions</Text>
        <View style={styles.grid}>
          <ActionCard icon="calendar" label="Create Event" sub="New pop-up" onPress={() => router.push('/(tabs)/create_business_event?from=dashboard')} />
          <ActionCard icon="handshake" label="Collaborate" sub="Partner up" />
          <ActionCard icon="offer" label="Create Offer" sub="Special deals" />
          <ActionCard
            icon="analytics"
            label="View Analytics"
            sub="Insights & data"
            onPress={() => router.push('/(tabs)/business_insights')}
          />
        </View>

        {/* ── Recent Reviews ── */}
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          reviews.map(r => <ReviewItem key={r.id} review={r} />)
        )}

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 16 },
  headerSub: { fontSize: 12, color: '#666', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', marginBottom: 12, fontSize: 13 },
  profileCard: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700', color: '#111' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  profileRating: { fontSize: 12, fontWeight: '600', color: '#333' },
  profileReviews: { fontSize: 12, color: '#777' },
  profileActions: { flexDirection: 'row', gap: 8 },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#bbb', borderRadius: 8, paddingVertical: 8 },
  outlineBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
  filledBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', borderRadius: 8, paddingVertical: 8 },
  filledBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },
  rightNowCard: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  rightNowTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rightNowLabel: { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 0.8 },
  updateBtn: { backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  updateBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  liveText: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
  rightNowDetail: { fontSize: 13, color: '#555', fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '47.5%', backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, gap: 3 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  statSub: { fontSize: 11, color: '#777' },
  actionCard: { width: '47.5%', backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, gap: 4 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 4 },
  actionSub: { fontSize: 11, color: '#777' },
  starsRow: { flexDirection: 'row', gap: 1 },
  star: { fontSize: 13 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ddd' },
  reviewItem: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewBody: { fontSize: 13, color: '#444', lineHeight: 18 },
  reviewBodyPlaceholder: { gap: 6 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  emptyText: { color: '#888', fontSize: 13, marginBottom: 16 },
});
