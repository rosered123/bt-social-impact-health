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
import { useFocusEffect, useRouter } from 'expo-router';
import { listMyEvents, type EventRow } from '@/services/api';
import { onEventsChanged } from '@/services/refresh-bus';

// ─── Draft Card ───────────────────────────────────────────────────────────────
const DraftCard: React.FC<{ event: EventRow; onEdit: () => void }> = ({ event, onEdit }) => (
  <View style={styles.card}>
    <View style={styles.cardImage} />
    <View style={styles.cardBody}>
      <Text style={styles.eventName}>{event.event_name}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>📅</Text>
        <Text style={styles.eventDetail}>
          {event.event_date}
          {event.start_time ? `  |  ${event.start_time}` : ''}
          {event.end_time ? `–${event.end_time}` : ''}
        </Text>
      </View>
      {event.location ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.eventDetail}>{event.location}</Text>
        </View>
      ) : null}
      <Text style={styles.statusText}>Draft • Not Published</Text>
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.75} onPress={onEdit}>
        <Text style={styles.editBtnText}>Continue Editing →</Text>
      </TouchableOpacity>
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

  // Refetch whenever the screen regains focus (works when it does fire).
  useFocusEffect(
    useCallback(() => {
      fetchDrafts();
    }, [fetchDrafts]),
  );

  // Also refetch whenever the create/edit screen signals that events changed.
  // This is the reliable path for hidden tab screens where useFocusEffect may
  // not fire between navigations.
  useEffect(() => {
    return onEventsChanged(() => {
      fetchDrafts();
    });
  }, [fetchDrafts]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

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

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} waiting to be published
          </Text>
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
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 14, marginTop: 32, paddingHorizontal: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  backBtn: { marginRight: 12 },
  backIcon: { fontSize: 24, fontWeight: '700', color: '#111' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },

  subtitle: {
    fontSize: 13, fontWeight: '500', color: '#666',
    paddingHorizontal: 16, marginBottom: 16,
  },

  card: { backgroundColor: '#D9D9D9', borderRadius: 10, marginBottom: 14, overflow: 'hidden' },
  cardImage: { height: 120, backgroundColor: '#ADADAD', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardBody: { paddingHorizontal: 14, paddingVertical: 10 },
  eventName: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailIcon: { fontSize: 16 },
  eventDetail: { fontSize: 15, fontWeight: '400', color: '#454545' },

  statusText: { fontSize: 13, fontWeight: '600', color: '#888', marginTop: 8, marginBottom: 10 },

  editBtn: { backgroundColor: '#222', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
