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

const BLUE = '#2E4A7A';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />
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

          {/* Stat boxes */}
          <View style={styles.statBoxRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{String(followerCount)}</Text>
              <Text style={styles.statBoxLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>—</Text>
              <Text style={styles.statBoxLabel}>Views Today</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statBoxValueRow}>
                <Text style={styles.statBoxValue}>{avgRating}</Text>
                <Feather name="star" size={16} color="#f5c518" />
              </View>
              <Text style={styles.statBoxLabel}>Rating</Text>
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
            <Feather name="chevron-right" size={18} color={BLUE} />
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

const RADIUS = 14;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: 48, paddingBottom: 16,
    marginHorizontal: -16, paddingHorizontal: 16,
    backgroundColor: '#FFF1AD',
  },
  headerTextWrap: { flex: 1 },
  headerWelcome: { fontSize: 14, color: '#555', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 2, marginBottom: 12 },
  gearBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  statBoxRow: {
    flexDirection: 'row', gap: 8,
    width: '100%', marginTop: 14,
  },
  statBox: {
    flex: 1, alignItems: 'flex-start', justifyContent: 'center',
    backgroundColor: BLUE, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  statBoxValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
  statBoxValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statBoxLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  errorText: { color: '#ef4444', marginBottom: 12, fontSize: 13, marginTop: 8 },

  // Live Now card
  liveCard: {
    backgroundColor: '#fff', borderRadius: RADIUS,
    padding: 16, marginTop: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  liveTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 14,
  },
  liveTitleCol: { flex: 1 },
  liveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  liveTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  liveSubtitle: { fontSize: 11, color: '#888', marginTop: 2, marginLeft: 18 },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: BLUE, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  updateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  subCardRow: { flexDirection: 'row', gap: 8 },
  subCard: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, alignItems: 'center',
  },
  subCardLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 3 },
  subCardValue: { fontSize: 13, fontWeight: '700', color: '#333' },

  // Pre-Order banner
  preOrderBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#7AAED6', borderRadius: RADIUS,
    paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 20,
  },
  preOrderText: { flex: 1, marginLeft: 12 },
  preOrderTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  preOrderSub: { fontSize: 12, color: '#333', marginTop: 2 },
  preOrderBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  preOrderBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Section title
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },

  // Today's Activity grid
  activityGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  activityCard: {
    width: '47.5%' as any, backgroundColor: '#fff',
    borderRadius: RADIUS, borderWidth: 1, borderColor: '#e5e7eb',
    padding: 14, gap: 3,
  },
  activityLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  activityValue: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 4 },
  activitySub: { fontSize: 11, color: '#888' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trendText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },

  // Quick Actions
  quickActionRow: {
    flexDirection: 'row', gap: 12, marginBottom: 24,
  },
  quickActionItem: { alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },

  // Upcoming Events
  eventsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: BLUE },
  eventCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: RADIUS,
    padding: 12, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventThumb: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#ddd', overflow: 'hidden', marginRight: 12,
  },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 3 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  eventDate: { fontSize: 12, color: '#696969' },
  eventRsvps: { fontSize: 13, fontWeight: '700', color: BLUE },
  eventRsvpsLabel: { fontWeight: '400', color: '#888' },

  emptyText: { color: '#888', fontSize: 13, marginBottom: 16 },
});
