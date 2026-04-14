import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listMyEvents, updateMyEvent, isActiveEventStatus, type EventRow, type EventStatus } from '@/services/api';
import { notifyEventsChanged, onEventsChanged } from '@/services/refresh-bus';

// Label + dot color for the live badge based on the current event status.
function getLiveDisplay(status: EventStatus): { label: string; color: string } {
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

// Mock stats for display
const MOCK_RSVPS = [87, 45, 62, 34, 91];
const MOCK_VIEWS = [450, 360, 280, 190, 520];

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = ['Upcoming', 'Live Now', 'Past'] as const;
type Tab = (typeof TABS)[number];

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard: React.FC<{ event: EventRow; index: number; isPast?: boolean }> = ({ event, index, isPast }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isLive = isActiveEventStatus(event.status);
  const canGoLive =
    !isLive && event.status !== 'closed' && event.status !== 'cancelled';
  const liveDisplay = getLiveDisplay(event.status);

  const handleSetLive = () => {
    Alert.alert(
      'Set this event as live?',
      `"${event.event_name}" will move to the Live Now tab.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Live',
          onPress: async () => {
            setBusy(true);
            try {
              await updateMyEvent(event.id, { status: 'open' });
              notifyEventsChanged();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to update event.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const rsvps = MOCK_RSVPS[index % MOCK_RSVPS.length];
  const views = MOCK_VIEWS[index % MOCK_VIEWS.length];

  return (
    <TouchableOpacity
      style={styles.eventCard}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/view_event', params: { eventId: String(event.id) } })}
    >
      {/* Cover image */}
      <View style={styles.eventCover}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={[StyleSheet.absoluteFill, isPast && { opacity: 0.5 }]} resizeMode="cover" />
        ) : null}
        {isPast && <View style={styles.pastOverlay} />}
        {isLive && (
          <View style={styles.liveBadge}>
            <LinearGradient
              colors={['#3b5998', '#2e4a7a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.liveBadgeBg}
            />
            <View style={[styles.liveDot, { backgroundColor: liveDisplay.color }]} />
            <Text style={styles.liveText}>{liveDisplay.label}</Text>
          </View>
        )}
      </View>

      {/* Event info */}
      <View style={styles.eventBody}>
        <Text style={[styles.eventName, isPast && styles.pastText]}>{event.event_name}</Text>
        <Text style={[styles.eventDetail, isPast && styles.pastDetailText]}>
          {event.event_date}
          {event.start_time ? `  |  ${event.start_time}` : ''}
          {event.end_time ? ` – ${event.end_time}` : ''}
        </Text>
        {event.location ? (
          <Text style={[styles.eventDetail, isPast && styles.pastDetailText]}>{event.location}</Text>
        ) : null}

        <View style={styles.statsRow}>
          <Text style={[styles.statValue, isPast && styles.pastStatValue]}>{rsvps} <Text style={[styles.statLabel, isPast && styles.pastStatLabel]}>RSVPs</Text></Text>
          <Text style={[styles.statValue, isPast && styles.pastStatValue]}>{views} <Text style={[styles.statLabel, isPast && styles.pastStatLabel]}>Views</Text></Text>
          <View style={{ flex: 1 }} />
          {isLive ? (
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/update_status',
                  params: { eventId: String(event.id) },
                })
              }
            >
              <Text style={styles.actionBtnText}>Update</Text>
            </TouchableOpacity>
          ) : canGoLive ? (
            <TouchableOpacity
              style={[styles.actionBtn, busy && { opacity: 0.5 }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleSetLive}
            >
              <Text style={styles.actionBtnText}>{busy ? '…' : 'Set Live'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BusinessEventsUpcoming() {
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [allEvents, setAllEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEvents = useCallback(async () => {
    try {
      const events = await listMyEvents(100);
      setAllEvents(events);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  useEffect(() => {
    return onEventsChanged(() => {
      fetchEvents();
    });
  }, [fetchEvents]);

  const drafts = allEvents.filter(e => !e.is_published);
  const upcomingEvents = allEvents.filter(
    e => e.is_published && !isActiveEventStatus(e.status) && e.status !== 'closed' && e.status !== 'cancelled',
  );
  const liveEvents = allEvents.filter(e => e.is_published && isActiveEventStatus(e.status));
  const pastEvents = allEvents.filter(e => e.status === 'closed' || e.status === 'cancelled');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Header + Tabs (golden gradient) ── */}
      <LinearGradient
        colors={['#f5d990', '#f0c060']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Events</Text>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/create_business_event?from=events')}
          >
            <Text style={styles.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {activeTab === 'Upcoming' && (
            <>
              {/* My Drafts banner */}
              <TouchableOpacity
                style={styles.draftBtn}
                activeOpacity={0.75}
                onPress={() => router.push('/buisness_events_drafts')}
              >
                <View style={styles.draftIconBox}>
                  <Feather name="file-text" size={20} color="#4a6fa5" />
                </View>
                <View style={styles.draftBtnContent}>
                  <Text style={styles.draftBtnTitle}>My Drafts</Text>
                  <Text style={styles.draftBtnSub}>
                    {drafts.length} draft{drafts.length !== 1 ? 's' : ''} waiting to be published
                  </Text>
                </View>
                <View style={styles.draftBadge}>
                  <Text style={styles.draftBadgeText}>{drafts.length}</Text>
                </View>
              </TouchableOpacity>

              {upcomingEvents.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming events yet. Create one!</Text>
              ) : (
                upcomingEvents.map((event, idx) => (
                  <EventCard key={event.id} event={event} index={idx} />
                ))
              )}
            </>
          )}

          {activeTab === 'Live Now' && (
            <>
              {liveEvents.length === 0 ? (
                <Text style={styles.emptyText}>No live events right now.</Text>
              ) : (
                liveEvents.map((event, idx) => (
                  <EventCard key={event.id} event={event} index={idx} />
                ))
              )}
            </>
          )}

          {activeTab === 'Past' && (
            <>
              {pastEvents.length === 0 ? (
                <Text style={styles.emptyText}>No past events yet.</Text>
              ) : (
                pastEvents.map((event, idx) => (
                  <EventCard key={event.id} event={event} index={idx} isPast />
                ))
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const RADIUS = 14;
const BLUE = '#2e4a7a';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 32 },

  // Header
  header: {
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
  createBtn: {
    backgroundColor: BLUE, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Filter tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1, alignItems: 'center',
    paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
  },
  tabActive: { backgroundColor: BLUE, borderColor: BLUE },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },

  // Drafts banner
  draftBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dce6f5', borderRadius: RADIUS,
    paddingHorizontal: 14, paddingVertical: 14,
    marginTop: 16, marginBottom: 16,
  },
  draftIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#c5d5ee',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  draftBtnContent: { flex: 1 },
  draftBtnTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  draftBtnSub: { fontSize: 12, color: '#555', fontWeight: '500' },
  draftBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  draftBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Event card
  eventCard: {
    backgroundColor: '#fff', borderRadius: RADIUS, marginTop: 16, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventCover: {
    height: 180, backgroundColor: '#ddd',
  },
  eventBody: { padding: 14 },
  eventName: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 4 },
  eventDetail: { fontSize: 14, color: '#555', marginBottom: 2 },
  statsRow: {
    flexDirection: 'row', gap: 28, marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee',
  },
  statValue: { fontSize: 15, fontWeight: '800', color: BLUE },
  statLabel: { fontWeight: '400', color: '#888' },

  // Live badge
  liveBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5, gap: 6,
    overflow: 'hidden',
  },
  liveBadgeBg: {
    ...StyleSheet.absoluteFillObject,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Past event styles
  pastOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180,180,180,0.4)',
  },
  pastText: { color: '#888' },
  pastDetailText: { color: '#aaa' },
  pastStatValue: { color: '#999' },
  pastStatLabel: { color: '#bbb' },

  // Update / Set Live button (in stats row)
  actionBtn: {
    backgroundColor: BLUE, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
