import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header (golden gradient) ── */}
        <LinearGradient
          colors={['#f5d990', '#f0c060']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
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
        </LinearGradient>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ── Live Now Card ── */}
        <View style={styles.liveCard}>
          <View style={styles.liveTopRow}>
            <View style={styles.liveTitleRow}>
              {liveEvent ? (
                <View style={[styles.liveDot, { backgroundColor: getRightNowDisplay(liveEvent.status).color }]} />
              ) : (
                <View style={[styles.liveDot, { backgroundColor: '#3b82f6' }]} />
              )}
              <Text style={styles.liveTitle}>Live Now</Text>
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
                <LinearGradient
                  colors={['#5179be', '#415e8f']}
                  style={styles.updateBtn}
                >
                  <Feather name="radio" size={18} color="#fff" />
                  <Text style={styles.updateBtnText}>Update</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>

          {liveEvent ? (
            <>
              <Text style={styles.liveSubtitle}>Tap to update status</Text>
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
          <LinearGradient
            colors={['rgb(208,235,255)', 'rgb(104,138,196)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.preOrderBanner}
          >
            <Feather name="shopping-bag" size={24} color="#000" />
            <View style={styles.preOrderText}>
              <Text style={styles.preOrderTitle}>Pre-Order Active</Text>
              <Text style={styles.preOrderSub}>Tap to manage orders</Text>
            </View>
            <View style={styles.preOrderBadge}>
              <Text style={styles.preOrderBadgeText}>12</Text>
            </View>
          </LinearGradient>
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
            <LinearGradient
              colors={['#7aaed6', '#3966b3']}
              style={styles.quickActionIcon}
            >
              <MaterialCommunityIcons name="chart-line" size={30} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Insights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/create_business_event?from=dashboard')}
          >
            <LinearGradient
              colors={['#c5e1f6', '#6f93d1']}
              style={styles.quickActionIcon}
            >
              <Feather name="calendar" size={26} color="#fff" />
            </LinearGradient>
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
  safe: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flex: 1 },

  // ── Header ──
  header: {
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 30,
  },
  headerTextWrap: { flex: 1 },
  headerWelcome: { fontSize: 18, color: '#000', fontWeight: '400' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#000', marginTop: 2 },
  gearBtn: {
    position: 'absolute',
    top: 24,
    right: 30,
  },

  // ── Stat pills ──
  statPillRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 16,
  },
  statPill: {
    backgroundColor: '#2e4a7a',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minWidth: 93,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12.5,
    elevation: 6,
  },
  statPillValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statPillLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    marginTop: 4,
  },
  statPillStar: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 17,
  },

  // ── Error ──
  errorText: { color: '#ef4444', marginHorizontal: 16, marginBottom: 8, fontSize: 13 },

  // ── Live Now Card ──
  liveCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  liveTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  liveTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  liveSubtitle: {
    fontSize: 14,
    color: '#000',
    marginTop: 4,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },

  // ── Sub-cards (Hours / Location / Stock) ──
  subCardRow: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 14,
  },
  subCard: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 10,
    height: 70,
    justifyContent: 'center',
  },
  subCardLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  subCardValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 4,
  },

  // ── Pre-Order Banner ──
  preOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  preOrderText: {
    flex: 1,
    marginLeft: 12,
  },
  preOrderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  preOrderSub: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  preOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2e4a7a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preOrderBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 8,
  },

  // ── Today's Activity ──
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
  },
  activityCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: '#d8d8d8',
    padding: 18,
    height: 82,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  activityValue: {
    fontSize: 22,
    fontWeight: '500',
    color: '#000',
    marginTop: 2,
  },
  activitySub: {
    fontSize: 14,
    color: '#696969',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    fontSize: 14,
    color: '#55be53',
  },

  // ── Quick Actions ──
  quickActionRow: {
    flexDirection: 'row',
    gap: 18,
    marginHorizontal: 26,
    marginBottom: 8,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d8d8d8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginTop: 5,
  },

  // ── Upcoming Events ──
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 16,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#4169e1',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 15,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  eventThumb: {
    width: 71,
    height: 71,
    borderRadius: 10,
    backgroundColor: '#d8d8d8',
    overflow: 'hidden',
  },
  eventInfo: { flex: 1, gap: 3 },
  eventName: { fontSize: 19, fontWeight: '500', color: '#000' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventDate: { fontSize: 16, color: '#696969' },
  eventRsvps: { fontSize: 16, color: '#000' },
  eventRsvpsLabel: { color: '#696969' },
  emptyText: { color: '#888', fontSize: 13, marginHorizontal: 16, marginBottom: 16 },
});
