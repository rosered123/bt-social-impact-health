import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
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
  isActiveEventStatus,
  type Profile,
  type Business,
  type ReviewRow,
  type EventRow,
  type EventStatus,
} from '@/services/api';
import { onEventsChanged, onProfileChanged } from '@/services/refresh-bus';

function formatTime(dbTime: string | null | undefined): string {
  if (!dbTime) return '—';
  const [hStr, mStr] = dbTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h)) return dbTime;
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

function getRightNowDisplay(status: EventStatus): { label: string; color: string } {
  switch (status) {
    case 'open':
      return { label: 'LIVE NOW', color: '#22c55e' };
    case 'closing_soon':
      return { label: 'CLOSING SOON', color: '#f59e0b' };
    case 'sold_out':
      return { label: 'SOLD OUT', color: '#ef4444' };
    case 'paused':
      return { label: 'ON BREAK', color: '#3b82f6' };
    default:
      return { label: 'LIVE NOW', color: '#22c55e' };
  }
}

export default function BusinessDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [liveEvent, setLiveEvent] = useState<EventRow | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventRow[]>([]);
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
      const live = events.find(e => e.is_published && isActiveEventStatus(e.status)) ?? null;
      setLiveEvent(live);
      const upcoming = events
        .filter(e => e.is_published && !isActiveEventStatus(e.status) && e.status !== 'closed' && e.status !== 'cancelled')
        .slice(0, 5);
      setUpcomingEvents(upcoming);
      setReviews(revs);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const offEvents = onEventsChanged(loadDashboard);
    const offProfile = onProfileChanged(loadDashboard);
    return () => {
      offEvents();
      offProfile();
    };
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

  const liveHours = liveEvent
    ? `${formatTime(liveEvent.start_time)} – ${formatTime(liveEvent.end_time)}`
    : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF14D" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header (golden gradient) ── */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerWelcome}>Welcome back</Text>
            <Text style={styles.headerTitle}>{businessName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Feather name="settings" size={26} color="#000" />
          </TouchableOpacity>

          {/* Stat pills */}
          <View style={styles.statPillRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{String(followerCount)}</Text>
              <Text style={styles.statPillLabel}>Followers</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>—</Text>
              <Text style={styles.statPillLabel}>Views Today</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{avgRating}</Text>
              <Text style={styles.statPillLabel}>Rating</Text>
              <Feather name="star" size={17} color="#f5c518" style={styles.statPillStar} />
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ── Live Now Card ── */}
        <View style={styles.liveCard}>
          <View style={styles.liveTopRow}>
            <View style={styles.liveTitleCol}>
              <View style={styles.liveTitleRow}>
                {liveEvent ? (
                  <View style={[styles.liveDot, { backgroundColor: getRightNowDisplay(liveEvent.status).color }]} />
                ) : (
                  <View style={[styles.liveDot, { backgroundColor: '#3b82f6' }]} />
                )}
                <Text style={styles.liveTitle}>Live Now</Text>
              </View>
              {liveEvent ? (
                <Text style={styles.liveSubtitle}>Tap to update status</Text>
              ) : null}
            </View>
            {liveEvent ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/update_status',
                    params: { eventId: String(liveEvent.id) },
                  })
                }
              >
                <View style={styles.updateBtn}>
                  <Feather name="radio" size={18} color="#fff" />
                  <Text style={styles.updateBtnText}>Update</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          {liveEvent ? (
            <>
              <View style={styles.subCardRow}>
                <View style={styles.subCard}>
                  <Text style={styles.subCardLabel}>Hours</Text>
                  <Text style={styles.subCardValue}>{liveHours}</Text>
                </View>
                <View style={styles.subCard}>
                  <Text style={styles.subCardLabel}>Location</Text>
                  <Text style={styles.subCardValue}>{liveEvent.location ?? '—'}</Text>
                </View>
                <View style={styles.subCard}>
                  <Text style={styles.subCardLabel}>Stock</Text>
                  <Text style={styles.subCardValue}>—</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.liveSubtitle}>No events right now</Text>
          )}
        </View>

        {/* ── Pre-Order Active Banner ── */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/pre_orders')}>
          <View style={styles.preOrderBanner}>
            <Feather name="shopping-bag" size={24} color="#000" />
            <View style={styles.preOrderText}>
              <Text style={styles.preOrderTitle}>Pre-Order Active</Text>
              <Text style={styles.preOrderSub}>Tap to manage orders</Text>
            </View>
            <View style={styles.preOrderBadge}>
              <Text style={styles.preOrderBadgeText}>12</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Today's Activity ── */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.activityGrid}>
          {/* Profile Views */}
          <View style={styles.activityCard}>
            <Text style={styles.activityLabel}>Profile Views</Text>
            <Text style={styles.activityValue}>—</Text>
            <View style={styles.trendRow}>
              <Feather name="trending-up" size={14} color="#55be53" />
              <Text style={styles.trendText}>+23%</Text>
            </View>
          </View>
          {/* Pre-Orders */}
          <View style={styles.activityCard}>
            <Text style={styles.activityLabel}>Pre-Orders</Text>
            <Text style={styles.activityValue}>—</Text>
            <Text style={styles.activitySub}>for today</Text>
          </View>
          {/* Engagement */}
          <View style={styles.activityCard}>
            <Text style={styles.activityLabel}>Engagement</Text>
            <Text style={styles.activityValue}>—</Text>
            <Text style={styles.activitySub}>Profile Saves</Text>
          </View>
          {/* Rating */}
          <View style={styles.activityCard}>
            <Text style={styles.activityLabel}>Rating</Text>
            <Text style={styles.activityValue}>{avgRating}</Text>
            <Text style={styles.activitySub}>{reviews.length} reviews</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/business_insights')}
          >
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons name="chart-line" size={30} color="#fff" />
            </View>
            <Text style={styles.quickActionLabel}>Insights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/create_business_event?from=dashboard')}
          >
            <View style={styles.quickActionIcon}>
              <Feather name="calendar" size={26} color="#fff" />
            </View>
            <Text style={styles.quickActionLabel}>Create Event</Text>
          </TouchableOpacity>
        </View>

        {/* ── Your Upcoming Events ── */}
        <View style={styles.eventsHeader}>
          <Text style={styles.sectionTitle}>Your Upcoming Events</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/buisness_events')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View all</Text>
            <Feather name="chevron-right" size={18} color="#4169e1" />
          </TouchableOpacity>
        </View>

        {upcomingEvents.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events.</Text>
        ) : (
          upcomingEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventThumb}>
                {event.cover_url ? (
                  <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.event_name}</Text>
                <View style={styles.eventMetaRow}>
                  <Feather name="calendar" size={14} color="#696969" />
                  <Text style={styles.eventDate}>{event.event_date}</Text>
                </View>
                <Text style={styles.eventRsvps}>
                  — <Text style={styles.eventRsvpsLabel}>RSVPs</Text>
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 16, marginHorizontal: -16, paddingHorizontal: 16, backgroundColor: '#FFF14D' },
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
  filledBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#07345F', borderRadius: 8, paddingVertical: 8 },
  filledBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },
  rightNowCard: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  rightNowTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rightNowLabel: { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 0.8 },
  updateBtn: { backgroundColor: '#07345F', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
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
