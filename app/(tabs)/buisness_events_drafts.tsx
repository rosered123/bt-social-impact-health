import React from 'react';
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
}

// ─── Draft Card ───────────────────────────────────────────────────────────────
const DraftCard: React.FC<{ event: DraftEvent }> = ({ event }) => (
  <View style={styles.card}>
    {/* Image placeholder */}
    <View style={styles.cardImage} />

    {/* Details */}
    <View style={styles.cardBody}>
      <Text style={styles.eventName}>{event.name}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>📅</Text>
        <Text style={styles.eventDetail}>{event.date}  |  {event.time}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>📍</Text>
        <Text style={styles.eventDetail}>{event.location}</Text>
      </View>

      {/* Status */}
      <Text style={styles.statusText}>Drafts • Not Published</Text>

      {/* Continue Editing */}
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.75}>
        <Text style={styles.editBtnText}>Continue Editing →</Text>
      </TouchableOpacity>
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
  },
  {
    id: '2',
    name: 'Event name',
    date: 'mm - dd - yyyy',
    time: '1 PM–4 PM',
    location: 'Location',
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BusinessEventsDrafts() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={() => router.replace('/buisness_events')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events Draft</Text>
      </View>

      {/* ── Subtitle ── */}
      <Text style={styles.subtitle}>
        {DRAFT_EVENTS.length} drafts waiting to be published
      </Text>

      {/* ── Draft List ── */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {DRAFT_EVENTS.map(event => (
          <DraftCard key={event.id} event={event} />
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backBtn: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },

  // Subtitle
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  // Draft Card
  card: {
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardImage: {
    height: 120,
    backgroundColor: '#ADADAD',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eventName: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailIcon: { fontSize: 16 },
  eventDetail: { fontSize: 15, fontWeight: '400', color: '#454545' },

  // Status
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginTop: 8,
    marginBottom: 10,
  },

  // Continue Editing Button
  editBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
