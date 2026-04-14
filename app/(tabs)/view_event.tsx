import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getBusinessByUid,
  getEventById,
  getInventory,
  listReviewsForBusiness,
  type Business,
  type EventRow,
  type InventoryItem,
  type ReviewRow,
} from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Availability ─────────────────────────────────────────────────────────────
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

// ─── Sentiment derived from reviews ──────────────────────────────────────────
const SENTIMENT_KEYWORDS = [
  { label: 'Quick Service', words: ['quick', 'fast', 'speedy', 'efficient'] },
  { label: 'Crowded', words: ['crowded', 'busy', 'packed', 'full', 'long line'] },
  { label: 'Lively', words: ['lively', 'fun', 'energy', 'vibe', 'atmosphere'] },
  { label: 'Friendly Staff', words: ['friendly', 'nice', 'kind', 'helpful', 'staff'] },
  { label: 'Great Value', words: ['value', 'worth', 'affordable', 'cheap', 'price'] },
];

function computeSentiment(reviews: ReviewRow[]): { label: string; pct: number }[] {
  if (reviews.length === 0) return [];
  return SENTIMENT_KEYWORDS
    .map(({ label, words }) => {
      const matches = reviews.filter(r =>
        words.some(w => r.body?.toLowerCase().includes(w))
      ).length;
      return { label, pct: Math.round((matches / reviews.length) * 100) };
    })
    .filter(s => s.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
}

export default function ViewEvent() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = params.eventId ? Number(params.eventId) : null;

  const [event, setEvent] = useState<EventRow | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sentiment, setSentiment] = useState<{ label: string; pct: number }[]>([]);
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
        if (ev?.host_uid) {
          const [biz, reviews] = await Promise.all([
            getBusinessByUid(ev.host_uid),
            listReviewsForBusiness(ev.host_uid, 100),
          ]);
          if (!cancelled) {
            setBusiness(biz);
            setSentiment(computeSentiment(reviews));
          }
        }
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
    ? new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long' })
    : '';
  const timeStr = event.start_time
    ? (() => {
        const [h, m] = event.start_time.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${period}`;
      })()
    : null;
  const dateTimeLine = [dateStr, timeStr].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Cover Image ── */}
        <View style={styles.cover}>
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

          {/* ── Title / Date / Location ── */}
          <Text style={styles.eventTitle}>{event.event_name}</Text>
          {dateTimeLine ? <Text style={styles.metaLine}>{dateTimeLine}</Text> : null}
          {event.location ? <Text style={styles.metaLine}>{event.location}</Text> : null}

          {/* ── Business Name ── */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/user_business_profile', params: { businessUid: event.host_uid } })}
            activeOpacity={0.7}
          >
            <Text style={styles.businessName}>{business?.business_name ?? 'Business'}</Text>
          </TouchableOpacity>

          {/* ── Vibe Tags ── */}
          {event.description ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsRow}>
              {event.description.split(',').map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.trim()}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* ── Action Buttons ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push({ pathname: '/(tabs)/add_review', params: { businessUid: event.host_uid, eventId: String(event.id) } })}
            >
              <Text style={styles.actionBtnText}>Add Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* ── Event Overview ── */}
          {event.story ? (
            <>
              <Text style={styles.sectionTitle}>Event Overview from business</Text>
              <Text style={styles.overviewText}>{event.story}</Text>
            </>
          ) : null}

          {/* ── Notification Banner ── */}
          <View style={styles.notifBanner}>
            <Text style={styles.notifText}>pushed notifications from business</Text>
          </View>

          {/* ── Menu / Products ── */}
          {inventory.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Menu</Text>
              <View style={styles.card}>
                {inventory.map((item, index) => (
                  <View key={item.id} style={[styles.menuRow, index < inventory.length - 1 && styles.menuRowBorder]}>
                    <Text style={styles.menuName}>{item.product_name}</Text>
                    <Text style={[styles.menuStock, { color: AVAIL_COLOR[item.availability] ?? '#888' }]}>
                      {AVAIL_LABEL[item.availability] ?? item.availability}
                    </Text>
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

          {/* ── What Customers Are Saying ── */}
          {sentiment.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>What customers are saying</Text>
              <View style={styles.card}>
                {sentiment.map((s, index) => (
                  <View key={s.label} style={[styles.sentimentRow, index < sentiment.length - 1 && styles.menuRowBorder]}>
                    <Text style={styles.sentimentLabel}>{s.label}</Text>
                    <Text style={styles.sentimentPct}>{s.pct}%</Text>
                  </View>
                ))}
                <Text style={styles.updatedText}>Updated [time]</Text>
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

  cover: {
    width: SCREEN_WIDTH,
    height: 200,
    backgroundColor: '#d0d0d0',
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
  },
  coverBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  coverBtnText: { fontSize: 16 },

  body: { paddingHorizontal: 16, paddingTop: 16 },

  eventTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 4 },
  metaLine: { fontSize: 13, color: '#555', marginBottom: 2 },
  businessName: { fontSize: 15, fontWeight: '700', color: '#111', marginTop: 10, marginBottom: 10 },

  tagsScroll: { marginBottom: 14 },
  tagsRow: { gap: 8, paddingRight: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ccc',
    paddingHorizontal: 12, paddingVertical: 5,
  },
  tagText: { fontSize: 12, color: '#333' },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#bbb',
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', backgroundColor: '#f0f0f0',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  overviewText: { fontSize: 13, color: '#444', lineHeight: 19, marginBottom: 20 },

  notifBanner: {
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 16, marginBottom: 20, alignItems: 'center',
  },
  notifText: { fontSize: 13, color: '#666' },

  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },

  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#d5d5d5' },
  menuName: { fontSize: 13, color: '#333', fontWeight: '500' },
  menuStock: { fontSize: 12, fontWeight: '700' },

  sentimentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  sentimentLabel: { fontSize: 13, color: '#333', fontWeight: '500' },
  sentimentPct: { fontSize: 13, color: '#555', fontWeight: '600' },

  updatedText: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 8 },
});
