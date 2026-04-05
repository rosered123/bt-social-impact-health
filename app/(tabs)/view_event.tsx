import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import {
  getEventById,
  getInventory,
  type EventRow,
  type InventoryItem,
} from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVAIL_LABEL: Record<string, string> = {
  full_stock: 'Full stock',
  low_stock: 'Low stock',
  limited_menu: 'Limited menu',
  closing_early: 'Closing early',
  closed_today: 'Closed today',
};

const AVAIL_COLOR: Record<string, string> = {
  full_stock: '#22c55e',
  low_stock: '#f59e0b',
  limited_menu: '#f59e0b',
  closing_early: '#ef4444',
  closed_today: '#ef4444',
};

const StockBadge: React.FC<{ availability: string }> = ({ availability }) => (
  <Text style={[styles.stockBadge, { color: AVAIL_COLOR[availability] ?? '#888' }]}>
    {AVAIL_LABEL[availability] ?? availability}
  </Text>
);

export default function ViewEvent() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = params.eventId ? Number(params.eventId) : null;

  const [event, setEvent] = useState<EventRow | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError('No event selected.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [ev, inv] = await Promise.all([getEventById(eventId), getInventory(eventId)]);
        if (cancelled) return;
        setEvent(ev);
        setInventory(inv);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load event.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error ?? 'Event not found.'}</Text>
      </SafeAreaView>
    );
  }

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';
  const timeStr = [event.start_time, event.end_time].filter(Boolean).join(' – ');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.coverImage}>
          <View style={styles.coverActions}>
            <TouchableOpacity style={styles.coverBtn} onPress={() => router.back()}>
              <Text style={styles.coverBtnText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.coverBtn} onPress={() => setSaved(s => !s)}>
              <Text style={styles.coverBtnText}>{saved ? '🔖' : '📌'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>

          <Text style={styles.eventTitle}>{event.event_name}</Text>
          {dateStr ? <Text style={styles.eventMeta}>{dateStr}{timeStr ? `, ${timeStr}` : ''}</Text> : null}
          {event.location ? <Text style={styles.eventMeta}>{event.location}</Text> : null}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(tabs)/add_review', params: { businessUid: event.host_uid, eventId: String(event.id) } })}>
              <Text style={styles.actionBtnText}>Add Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {event.story ? (
            <>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.storyText}>{event.story}</Text>
            </>
          ) : null}

          {inventory.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Menu / Products</Text>
              <View style={styles.card}>
                {inventory.map((item, index) => (
                  <View key={item.id} style={[styles.menuRow, index < inventory.length - 1 && styles.menuRowBorder]}>
                    <Text style={styles.menuName}>{item.product_name}</Text>
                    <StockBadge availability={item.availability} />
                  </View>
                ))}
                {inventory[0]?.updated_at ? (
                  <Text style={styles.updatedText}>
                    Updated {new Date(inventory[0].updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : null}
              </View>
            </>
          ) : null}

        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  coverImage: { width: SCREEN_WIDTH, height: 220, backgroundColor: '#d0d0d0', justifyContent: 'space-between' },
  coverActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 12 },
  coverBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  coverBtnText: { fontSize: 16 },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  eventTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 4 },
  eventMeta: { fontSize: 13, color: '#666', marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 20 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderColor: '#bbb', borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f0f0f0' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  storyText: { fontSize: 13, color: '#444', lineHeight: 19, marginBottom: 20 },
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#d5d5d5' },
  menuName: { fontSize: 13, color: '#333', fontWeight: '500' },
  stockBadge: { fontSize: 12, fontWeight: '700' },
  updatedText: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 8 },
});
