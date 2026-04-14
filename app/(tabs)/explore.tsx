import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { EventWithBusiness, listPublishedEvents } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HALF = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PopUpEvent {
  id: number;
  title: string;
  business: string;
  time: string;
  address: string;
  cover_url: string | null;
  saved: boolean;
}

// ─── Save Button ──────────────────────────────────────────────────────────────
const SaveBtn: React.FC<{ saved: boolean; onToggle: () => void; dark?: boolean }> = ({
  saved, onToggle, dark,
}) => (
  <TouchableOpacity
    style={[styles.saveBtn, dark && styles.saveBtnDark]}
    onPress={onToggle}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  >
    <Text style={[styles.saveHeart, saved && styles.saveHeartActive]}>♥</Text>
  </TouchableOpacity>
);

// ─── Grid Card (Events near you) ──────────────────────────────────────────────
const GridCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void; onPress: () => void }> = ({
  event, onToggleSave, onPress,
}) => (
  <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.gridCardImage}>
      {event.cover_url ? (
        <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <SaveBtn saved={event.saved} onToggle={onToggleSave} />
    </View>
    <View style={styles.gridCardBody}>
      <Text style={styles.gridCardTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.gridCardSub} numberOfLines={1}>{event.business}</Text>
      <Text style={styles.gridCardSub} numberOfLines={1}>{event.time}</Text>
      <Text style={styles.gridCardSub} numberOfLines={1}>{event.address}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Feature Card (We think you'll like) ─────────────────────────────────────
const FeatureCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void; onPress: () => void }> = ({
  event, onToggleSave, onPress,
}) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.featureCardImage}>
      {event.cover_url ? (
        <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
    </View>
    <View style={styles.featureCardBody}>
      <View style={styles.featureCardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.featureCardTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.featureCardSub} numberOfLines={1}>{event.business}</Text>
          <Text style={styles.featureCardSub} numberOfLines={1}>
            {event.time} | {event.address}
          </Text>
        </View>
        <SaveBtn saved={event.saved} onToggle={onToggleSave} dark />
      </View>
    </View>
  </TouchableOpacity>
);

// ─── List Card (Popular in Austin) ───────────────────────────────────────────
const ListCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void; onPress: () => void }> = ({
  event, onToggleSave, onPress,
}) => (
  <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.listCardImage}>
      {event.cover_url ? (
        <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
    </View>
    <View style={styles.listCardBody}>
      <Text style={styles.listCardTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.listCardSub} numberOfLines={1}>{event.business}</Text>
      <Text style={styles.listCardSub} numberOfLines={1}>
        {event.time} | {event.address}
      </Text>
    </View>
    <SaveBtn saved={event.saved} onToggle={onToggleSave} dark />
  </TouchableOpacity>
);

function formatEventTime(eventDate: string, startTime: string | null): string {
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return eventDate;
  }

  const day = date.toLocaleDateString(undefined, { weekday: 'long' });
  if (!startTime) {
    return day;
  }

  const [hourPart, minutePart] = startTime.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return day;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${day}, ${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

function mapDbEventToCard(event: EventWithBusiness): PopUpEvent {
  return {
    id: event.id,
    title: event.event_name,
    business: event.business_name,
    time: formatEventTime(event.event_date, event.start_time),
    address: event.location ?? 'Location TBA',
    cover_url: event.cover_url,
    saved: false,
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Explore() {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<PopUpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      setLoading(true);
      setErrorText(null);
      try {
        const rows = await listPublishedEvents(50);
        if (mounted) {
          setEvents(rows.map(mapDbEventToCard));
        }
      } catch (error: any) {
        if (mounted) {
          setErrorText(error?.message ?? 'Could not load events.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return events;
    }

    return events.filter(event =>
      [event.title, event.business, event.time, event.address].some(value =>
        value.toLowerCase().includes(q)
      )
    );
  }, [events, search]);

  const uniqueEvents = useMemo(() => {
    const seen = new Set<number>();
    return filteredEvents.filter(event => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    });
  }, [filteredEvents]);

  const nearYou = uniqueEvents.slice(0, 2);
  const forYou = uniqueEvents.slice(2, 4);
  const popular = uniqueEvents.slice(4);

  const toggleSave = (id: number) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, saved: !e.saved } : e)));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF14D" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Pop-Ups</Text>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder=""
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Loading events...</Text>
          </View>
        ) : null}

        {errorText ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        {!loading && !errorText && filteredEvents.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>No published events found.</Text>
          </View>
        ) : null}

        {nearYou.length > 0 ? (
          <>
            {/* ── Events Near You ── */}
            <Text style={styles.sectionTitle}>Events near you</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gridScroll}
            >
              {nearYou.map(event => (
                <GridCard
                  key={event.id}
                  event={event}
                  onToggleSave={() => toggleSave(event.id)}
                  onPress={() => router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: String(event.id) } })}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {forYou.length > 0 ? (
          <>
            {/* ── We Think You'll Like ── */}
            <Text style={styles.sectionTitle}>We think you'll like</Text>
            {forYou.map(event => (
              <FeatureCard
                key={event.id}
                event={event}
                onToggleSave={() => toggleSave(event.id)}
                onPress={() => router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: String(event.id) } })}
              />
            ))}
          </>
        ) : null}

        {popular.length > 0 ? (
          <>
            {/* ── Popular in Austin ── */}
            <Text style={styles.sectionTitle}>Popular in Austin</Text>
            <View style={styles.card}>
              {popular.map((event, index) => (
                <View key={event.id}>
                  <ListCard
                    event={event}
                    onToggleSave={() => toggleSave(event.id)}
                    onPress={() => router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: String(event.id) } })}
                  />
                  {index < popular.length - 1 && <View style={styles.listDivider} />}
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG = '#e8e8e8';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: { paddingTop: 16, paddingBottom: 12, marginHorizontal: -16, paddingHorizontal: 16, backgroundColor: '#FFF14D' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: CARD_BG, borderRadius: 30,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 22,
  },
  searchIcon: { fontSize: 15, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  // Section title
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 12 },
  centerState: { alignItems: 'center', justifyContent: 'center', marginBottom: 18, gap: 8 },
  stateText: { fontSize: 13, color: '#555' },
  errorText: { fontSize: 13, color: '#b91c1c', fontWeight: '600' },

  // Grid (near you)
  gridScroll: { gap: 10, paddingRight: 4, marginBottom: 22 },
  gridCard: {
    width: CARD_HALF,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  gridCardImage: {
    width: '100%', height: 130,
    backgroundColor: '#bbb',
    alignItems: 'flex-end',
    padding: 8,
  },
  gridCardBody: { padding: 10, gap: 2 },
  gridCardTitle: { fontSize: 13, fontWeight: '800', color: '#111' },
  gridCardSub: { fontSize: 11, color: '#666' },

  // Feature card (for you)
  featureCard: {
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    overflow: 'hidden', marginBottom: 12,
  },
  featureCardImage: { width: '100%', height: 160, backgroundColor: '#bbb' },
  featureCardBody: { padding: 12 },
  featureCardRow: { flexDirection: 'row', alignItems: 'center' },
  featureCardTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 2 },
  featureCardSub: { fontSize: 12, color: '#666' },

  // List card (popular)
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 12, marginBottom: 20 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  listCardImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#bbb', overflow: 'hidden' },
  listCardBody: { flex: 1, gap: 2 },
  listCardTitle: { fontSize: 13, fontWeight: '800', color: '#111' },
  listCardSub: { fontSize: 11, color: '#666' },
  listDivider: { height: 1, backgroundColor: '#d5d5d5', marginVertical: 4 },

  // Save button
  saveBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDark: { backgroundColor: 'transparent' },
  saveHeart: { fontSize: 18, color: '#ccc' },
  saveHeartActive: { color: '#111' },
});