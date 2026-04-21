import { imageSource } from "@/utils/imageSource";
import { router, useFocusEffect, useGlobalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import {
  isEventSaved,
  saveEvent,
  unsaveEvent,
} from '@/services/saved-events';

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

const TAG_ICONS: Record<string, string> = {
  matcha: '🍵', coffee: '☕', tea: '🫖', latte: '☕', espresso: '☕',
  food: '🍽️', pizza: '🍕', tacos: '🌮', noodles: '🍜', burger: '🍔', pastry: '🥐', bakery: '🥖', dessert: '🍰', ice: '🍦', vegan: '🌱',
  organic: '🌿', local: '📍', handmade: '🤲', artisan: '✨',
  market: '🛍️', pop: '🎪', outdoor: '🌤️', indoor: '🏠', live: '🎵', music: '🎶',
  drinks: '🥤', juice: '🍊', smoothie: '🥤', wine: '🍷', beer: '🍺',
  family: '👨‍👩‍👧', dog: '🐶', pet: '🐾', kids: '🧒',
  wellness: '🧘', yoga: '🧘', fitness: '💪', health: '💚',
  art: '🎨', craft: '🎨', vintage: '🕰️', thrift: '👗',
  grab: '🛒', quick: '⚡', fast: '⚡', free: '🎁',
};

function tagIcon(tag: string): string {
  const lower = tag.toLowerCase();
  for (const [key, icon] of Object.entries(TAG_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '✦';
}

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
  const params = useGlobalSearchParams<{ eventId?: string }>();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sentiment, setSentiment] = useState<{ label: string; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [rsvped, setRsvped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    const eventId = params.eventId ? Number(params.eventId) : null;

    if (!eventId) {
      setLoading(false);
      setError('No event selected.');
      return;
    }

    // Reset state for fresh load on each focus
    setLoading(true);
    setError(null);
    setEvent(null);
    setBusiness(null);
    setInventory([]);
    setSentiment([]);
    setSaved(isEventSaved(eventId));
    setRsvped(false);

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
  }, [params.eventId]));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#333" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error ?? 'Event not found.'}</Text>
        </View>
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Cover photo — stretches to top of screen ── */}
        <View style={styles.cover}>
          {event.cover_url ? (
            <Image source={imageSource(event.cover_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
          ) : null}
          {/* Dark gradient so white buttons are readable */}
          <View style={styles.coverGradient} />
          {/* Floating back + save buttons */}
          <SafeAreaView style={styles.coverOverlay} edges={['top']}>
            <View style={styles.coverActions}>
              <TouchableOpacity style={styles.coverBtn} onPress={() => router.navigate('/(tabs)/explore')}>
                <Text style={styles.coverBtnText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.coverBtn}
                onPress={() => {
                  if (!event) return;
                  if (saved) {
                    unsaveEvent(event.id);
                    setSaved(false);
                  } else {
                    saveEvent({
                      id: event.id,
                      event_name: event.event_name,
                      event_date: event.event_date,
                      start_time: event.start_time,
                      end_time: event.end_time,
                      location: event.location,
                      cover_url: event.cover_url,
                      business_name: business?.business_name ?? 'Business',
                    });
                    setSaved(true);
                  }
                }}
              >
                <Text style={[styles.heartIcon, saved && styles.heartIconSaved]}>♥</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Yellow section: title → action buttons ── */}
        <View style={styles.yellowSection}>
          <Text style={styles.eventTitle}>{event.event_name}</Text>
          {dateTimeLine ? <Text style={styles.metaLine}>{dateTimeLine}</Text> : null}
          {event.location ? <Text style={styles.metaLine}>{event.location}</Text> : null}

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/user_business_profile', params: { businessUid: event.host_uid, fromEventId: String(event.id) } })}
            activeOpacity={0.7}
          >
            <Text style={styles.businessName}>{business?.business_name ?? 'Business'}</Text>
          </TouchableOpacity>

          {event.description ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsRow}>
              {event.description.split(',').map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tagIcon(tag.trim())} {tag.trim()}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* ── Action buttons ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, rsvped && styles.actionBtnActive]}
              onPress={() => setRsvped(r => !r)}
            >
              <Text style={[styles.actionBtnText, rsvped && styles.actionBtnTextActive]}>
                {rsvped ? 'RSVPed ✓' : 'RSVP'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push({ pathname: '/(tabs)/add_review', params: { businessUid: event.host_uid, eventId: String(event.id) } })}
            >
              <Text style={styles.actionBtnText}>Add Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Share.share({ message: `Check out ${event.event_name} by ${business?.business_name ?? 'a pop-up business'}!` })}>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Grey content section ── */}
        <View style={styles.body}>

          {event.story ? (
            <>
              {/* <Text style={styles.sectionTitle}>Event Overview</Text> */}
              <Text style={styles.overviewText}>{event.story}</Text>
            </>
          ) : null}

          <Text style={styles.announcementText}>Announcements</Text>
          <View style={styles.notifBanner}>
            
            <Text style={styles.notifText}>Notifications from business</Text>
          </View>

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
              </View>
            </>
          ) : null}
          
          {inventory.length > 0 ? (
            <>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Menu</Text>
                <TouchableOpacity
                  style={styles.preOrderBtn}
                  onPress={() => router.navigate({
                    pathname: '/(tabs)/customer_preorder',
                    params: { eventId: String(event.id), eventName: event.event_name, businessUid: event.host_uid, eventLocation: event.location ?? '', startTime: event.start_time ?? '', endTime: event.end_time ?? '' },
                  })}
                >
                  <Text style={styles.preOrderBtnText}>Pre Order</Text>
                </TouchableOpacity>
              </View>

              {(() => {
                const available = inventory.filter(i => i.availability === 'full_stock');
                const lowStock = inventory.filter(i => ['low_stock', 'limited_menu', 'closing_early'].includes(i.availability));
                const soldOut = inventory.filter(i => i.availability === 'closed_today');
                const updatedAt = inventory[0]?.updated_at;

                const renderGroup = (items: typeof inventory, label: string, dotColor: string) => {
                  if (items.length === 0) return null;
                  return (
                    <View style={styles.menuGroup}>
                      <View style={styles.menuGroupHeader}>
                        <View style={[styles.menuGroupDot, { backgroundColor: dotColor }]} />
                        <Text style={styles.menuGroupLabel}>{label}</Text>
                      </View>
                      <View style={styles.card}>
                        {items.map((item, index) => (
                          <View key={item.id} style={[styles.menuRow, index < items.length - 1 && styles.menuRowBorder]}>
                            <Text style={styles.menuName}>{item.product_name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                };

                return (
                  <>
                    {renderGroup(available, 'Available', '#22c55e')}
                    {renderGroup(lowStock, 'Low Stock', '#f59e0b')}
                    {renderGroup(soldOut, 'Sold Out', '#ef4444')}
                    {updatedAt ? (
                      <Text style={styles.updatedText}>
                        Updated {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    ) : null}
                  </>
                );
              })()}
            </>
          ) : null}

          {/* {sentiment.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>What customers are saying</Text>
              <View style={styles.card}>
                {sentiment.map((s, index) => (
                  <View key={s.label} style={[styles.sentimentRow, index < sentiment.length - 1 && styles.menuRowBorder]}>
                    <Text style={styles.sentimentLabel}>{s.label}</Text>
                    <Text style={styles.sentimentPct}>{s.pct}%</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null} */}

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

  // Cover — full width, stretches to absolute top
  cover: {
    width: SCREEN_WIDTH,
    height: 260,
    backgroundColor: '#c8c8c8',
  },
  announcementText: {
    fontSize: 20,
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  coverBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  coverBtnText: { fontSize: 18, color: '#111' },
  heartIcon: { fontSize: 20, color: '#ccc' },
  heartIconSaved: { color: '#e03d3d' },

  // Yellow section
  yellowSection: {
    backgroundColor: '#FFF1AD',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  eventTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 4 },
  metaLine: { fontSize: 13, color: '#555', marginBottom: 2 },
  businessName: { fontSize: 15, fontWeight: '700', color: '#2E4A7A', marginTop: 8, marginBottom: 10 },

  tagsScroll: { marginBottom: 14 },
  tagsRow: { gap: 8, paddingRight: 8 },
  tag: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tagText: { fontSize: 12, color: '#333' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', backgroundColor: '#7AAED6',
  },
  actionBtnActive: { backgroundColor: '#2E4A7A' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#2E4A7A' },
  actionBtnTextActive: { color: '#fff' },

  // Grey content
  body: { paddingHorizontal: 16, paddingTop: 20 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  overviewText: { fontSize: 13, color: '#444', lineHeight: 19, marginBottom: 20 },

  notifBanner: {
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 16, marginBottom: 20, alignItems: 'center',
  },
  notifText: { fontSize: 13, color: '#666' },

  preOrderBtn: { backgroundColor: '#2E4A7A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  preOrderBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#d5d5d5' },
  menuName: { fontSize: 13, color: '#333', fontWeight: '500' },
  menuStock: { fontSize: 12, fontWeight: '700' },

  menuGroup: { marginBottom: 12 },
  menuGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  menuGroupDot: { width: 10, height: 10, borderRadius: 5 },
  menuGroupLabel: { fontSize: 13, fontWeight: '800', color: '#333' },

  sentimentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  sentimentLabel: { fontSize: 13, color: '#333', fontWeight: '500' },
  sentimentPct: { fontSize: 13, color: '#555', fontWeight: '600' },

  updatedText: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 8 },
});
