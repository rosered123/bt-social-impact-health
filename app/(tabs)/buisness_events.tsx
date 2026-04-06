import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DraftEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  rsvps: number;
  views: number;
  isLive?: boolean;
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const TABS = ['Upcoming', 'Live now', 'Past'] as const;
type Tab = (typeof TABS)[number];

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard: React.FC<{ event: DraftEvent }> = ({ event }) => (
  <View style={styles.eventCard}>
    {/* Image placeholder */}
    <View style={styles.eventImageTop}>
      {event.isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE NOW</Text>
        </View>
      )}
    </View>
    <View style={styles.eventImageBar} />

    {/* Details */}
    <View style={styles.eventBody}>
      <Text style={styles.eventName}>{event.name}</Text>
      <View style={styles.eventDetailRow}>
        <Text style={styles.detailIcon}>📅</Text>
        <Text style={styles.eventDetail}>{event.date}  |  {event.time}</Text>
      </View>
      <View style={styles.eventDetailRow}>
        <Text style={styles.detailIcon}>📍</Text>
        <Text style={styles.eventDetail}>{event.location}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statText}>{event.rsvps} RSVPs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👁</Text>
          <Text style={styles.statText}>{event.views} Views</Text>
        </View>
          </View>
    </View>
  </View>
);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const DRAFT_EVENTS: DraftEvent[] = [
  {
    id: '1',
    name: 'Event name',
    date: 'mm - dd - yyyy',
    time: '1 PM–4 PM',
    location: 'Location',
    rsvps: 0,
    views: 0,
  },
  {
    id: '2',
    name: 'Event name',
    date: 'mm - dd - yyyy',
    time: '1 PM–4 PM',
    location: 'Location',
    rsvps: 0,
    views: 0,
  },
];

const LIVE_EVENTS: DraftEvent[] = [
  {
    id: '1',
    name: 'Event name',
    date: 'mm - dd - yyyy',
    time: '1 PM–4 PM',
    location: 'Location',
    rsvps: 0,
    views: 0,
    isLive: true,
  },
];

const PAST_EVENTS: DraftEvent[] = [
  {
    id: '1',
    name: 'Event name',
    date: 'mm - dd - yyyy',
    time: '1 PM–4 PM',
    location: 'Location',
    rsvps: 0,
    views: 0,
  },
  {
    id: '2',
    name: 'Event name',
    date: 'mm - dd - yyyy',
    time: '1 PM–4 PM',
    location: 'Location',
    rsvps: 0,
    views: 0,
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BusinessEventsUpcoming() {
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.85}>
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

      {/* ── Content ── */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {activeTab === 'Upcoming' && (
          <>
            {/* ── My Draft Button ── */}
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
                  {DRAFT_EVENTS.length} drafts waiting to be published
                </Text>
              </View>
            </TouchableOpacity>

            {DRAFT_EVENTS.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}

        {activeTab === 'Live now' && (
          <>
            {LIVE_EVENTS.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}

        {activeTab === 'Past' && (
          <>
            {PAST_EVENTS.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
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

  // Filter Tabs
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
  tabActive: {
    backgroundColor: '#222',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },

  // My Draft Button
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#c0c0c0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  draftIcon: { fontSize: 20 },
  draftBtnContent: { flex: 1 },
  draftBtnTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  draftBtnSub: { fontSize: 12, color: '#666', fontWeight: '500' },

  // Live Badge
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Event Card
  eventCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  eventImageTop: {
    height: 83,
    backgroundColor: '#ADADAD',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  eventImageBar: {
    height: 37,
    backgroundColor: '#ADADAD',
  },
  eventBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eventName: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  eventDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailIcon: { fontSize: 16 },
  eventDetail: { fontSize: 15, fontWeight: '400', color: '#454545' },
  divider: {
    height: 1,
    backgroundColor: '#929292',
    marginTop: 8,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 16 },
  statText: { fontSize: 15, fontWeight: '700', color: '#000' },

});
