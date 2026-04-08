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
      return { label: 'ON BREAK', color: '#9ca3af' };
    default:
      return { label: 'LIVE NOW', color: '#22c55e' };
  }
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = ['Upcoming', 'Live now', 'Past'] as const;
type Tab = (typeof TABS)[number];

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard: React.FC<{ event: EventRow }> = ({ event }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isLive = isActiveEventStatus(event.status);
  const canGoLive =
    !isLive && event.status !== 'closed' && event.status !== 'cancelled';
  const liveDisplay = getLiveDisplay(event.status);

  const handleSetLive = () => {
    Alert.alert(
      'Set this event as live?',
      `"${event.event_name}" will move to the Live now tab.`,
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

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventImageTop}>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, { backgroundColor: liveDisplay.color }]} />
            <Text style={styles.liveText}>{liveDisplay.label}</Text>
          </View>
        )}
      </View>
      <View style={styles.eventImageBar} />
      <View style={styles.eventBody}>
        <View style={styles.eventBodyHeader}>
          <Text style={styles.eventName}>{event.event_name}</Text>
          {isLive ? (
            <TouchableOpacity
              style={styles.updateBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/update_status',
                  params: { eventId: String(event.id) },
                })
              }
            >
              <Text style={styles.updateBtnText}>Update</Text>
            </TouchableOpacity>
          ) : canGoLive ? (
            <TouchableOpacity
              style={[styles.updateBtn, busy && { opacity: 0.5 }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleSetLive}
            >
              <Text style={styles.updateBtnText}>{busy ? '…' : 'Set Live'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.eventDetailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.eventDetail}>
            {event.event_date}
            {event.start_time ? `  |  ${event.start_time}` : ''}
            {event.end_time ? `–${event.end_time}` : ''}
          </Text>
        </View>
        {event.location ? (
          <View style={styles.eventDetailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.eventDetail}>{event.location}</Text>
          </View>
        ) : null}
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📌</Text>
            <Text style={styles.statText}>{event.status}</Text>
          </View>
        </View>
      </View>
    </View>
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

  // Refetch when the screen gains focus (may not always fire for hidden tab
  // screens — refresh-bus subscription below is the reliable path).
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

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/create_business_event?from=events')}
        >
          <Text style={styles.createBtnText}>Create +</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs ── */}
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

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {activeTab === 'Upcoming' && (
            <>
              <TouchableOpacity
                style={styles.draftBtn}
                activeOpacity={0.75}
                onPress={() => router.push('/buisness_events_drafts')}
              >
                <View style={styles.draftIconBox}>
                  <Text style={styles.draftIcon}>📄</Text>
                </View>
                <View style={styles.draftBtnContent}>
                  <Text style={styles.draftBtnTitle}>My drafts</Text>
                  <Text style={styles.draftBtnSub}>
                    {drafts.length} draft{drafts.length !== 1 ? 's' : ''} waiting to be published
                  </Text>
                </View>
              </TouchableOpacity>

              {upcomingEvents.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming events yet. Create one!</Text>
              ) : (
                upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </>
          )}

          {activeTab === 'Live now' && (
            <>
              {liveEvents.length === 0 ? (
                <Text style={styles.emptyText}>No live events right now.</Text>
              ) : (
                liveEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </>
          )}

          {activeTab === 'Past' && (
            <>
              {pastEvents.length === 0 ? (
                <Text style={styles.emptyText}>No past events yet.</Text>
              ) : (
                pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
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
const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  createBtn: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD_BG,
  },
  tabActive: { backgroundColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },

  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#696969',
    borderRadius: 8,
    height: 66,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  draftIconBox: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#c0c0c0',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  draftIcon: { fontSize: 20 },
  draftBtnContent: { flex: 1 },
  draftBtnTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  draftBtnSub: { fontSize: 12, color: '#666', fontWeight: '500' },

  liveBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  eventCard: {
    backgroundColor: '#D9D9D9', borderRadius: 10, marginBottom: 14, overflow: 'hidden',
  },
  eventImageTop: {
    height: 83, backgroundColor: '#ADADAD',
    borderTopLeftRadius: 10, borderTopRightRadius: 10,
  },
  eventImageBar: { height: 37, backgroundColor: '#ADADAD' },
  eventBody: { paddingHorizontal: 14, paddingVertical: 10 },
  eventBodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventName: { fontSize: 18, fontWeight: '700', color: '#000', flexShrink: 1 },
  eventDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailIcon: { fontSize: 16 },
  eventDetail: { fontSize: 15, fontWeight: '400', color: '#454545' },
  divider: { height: 1, backgroundColor: '#929292', marginTop: 8, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 28 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 16 },
  statText: { fontSize: 15, fontWeight: '700', color: '#000', textTransform: 'capitalize' },

  // Update Button (live events)
  updateBtn: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
