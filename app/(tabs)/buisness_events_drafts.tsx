import { imageSource } from "@/utils/imageSource";
import { Feather } from '@expo/vector-icons';

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
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listMyEvents, type EventRow } from '@/services/api';
import { onEventsChanged } from '@/services/refresh-bus';

// ─── Draft Card ───────────────────────────────────────────────────────────────
const DraftCard: React.FC<{ event: EventRow; onEdit: () => void }> = ({ event, onEdit }) => (
  <View style={styles.cardOuter}>
    <View style={styles.card}>
      {/* Cover image */}
      <View style={styles.cardCover}>
        {event.cover_url ? (
          <Image source={imageSource(event.cover_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.eventName}>{event.event_name}</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onEdit}>
            <Feather name="edit" size={18} color="#e8a840" />
          </TouchableOpacity>
        </View>

        <Text style={styles.eventDetail}>
          {event.event_date}
          {event.start_time ? `  |  ${event.start_time}` : ''}
          {event.end_time ? ` – ${event.end_time}` : ''}
        </Text>
        {event.location ? (
          <Text style={styles.eventDetail}>{event.location}</Text>
        ) : null}

        {/* Bottom row */}
        <View style={styles.bottomDivider} />
        <View style={styles.bottomRow}>
          <Text style={styles.statusText}>Drafts • Not Published</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onEdit}>
            <Text style={styles.continueText}>Continue Editing →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BusinessEventsDrafts() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = useCallback(async () => {
    try {
      const events = await listMyEvents(100);
      setDrafts(events.filter(e => !e.is_published));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDrafts();
    }, [fetchDrafts]),
  );

  useEffect(() => {
    return onEventsChanged(() => {
      fetchDrafts();
    });
  }, [fetchDrafts]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Header (golden gradient) ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={() => router.replace('/buisness_events')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Drafts</Text>
        </View>
        <Text style={styles.subtitle}>
          {drafts.length} draft{drafts.length !== 1 ? 's' : ''} waiting to be published
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {drafts.length === 0 ? (
            <Text style={styles.emptyText}>No drafts yet.</Text>
          ) : (
            drafts.map(event => (
              <DraftCard
                key={event.id}
                event={event}
                onEdit={() =>
                  router.push({
                    pathname: '/create_business_event',
                    params: { from: 'drafts', eventId: String(event.id) },
                  })
                }
              />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const RADIUS = 14;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 32, paddingHorizontal: 16 },

  // Header
  header: {
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14,
    backgroundColor: '#FFF1AD',
    borderBottomWidth: 1,
    borderBottomColor: '#B4B4B4',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { marginRight: 12 },
  backIcon: { fontSize: 24, fontWeight: '700', color: '#111' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#555', marginLeft: 36 },

  // Card with dashed border
  cardOuter: {
    borderWidth: 2, borderColor: '#e8a840', borderStyle: 'dashed',
    borderRadius: RADIUS + 2, padding: 3,
    marginBottom: 16, marginTop: 8,
  },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS, overflow: 'hidden',
  },
  cardCover: {
    height: 160, backgroundColor: '#e0e0e0',
  },
  cardBody: { padding: 14 },

  nameRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventName: { fontSize: 18, fontWeight: '800', color: '#111', flexShrink: 1 },
  eventDetail: { fontSize: 14, color: '#555', marginBottom: 2 },

  bottomDivider: { height: 1, backgroundColor: '#eee', marginTop: 10, marginBottom: 10 },
  bottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  statusText: { fontSize: 13, fontWeight: '600', color: '#888' },
  continueText: { fontSize: 13, fontWeight: '600', color: '#2E4A7A' },
});
