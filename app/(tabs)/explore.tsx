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

import {
  EventWithBusiness,
  getBusinessEvents,
  getFollowedBusinesses,
  listPublishedEvents,
  type Business,
  type EventRow,
} from '@/services/api';
import { isEventSaved, saveEvent, unsaveEvent } from '@/services/saved-events';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HALF = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

interface PopUpEvent {
  id: number;
  title: string;
  business: string;
  time: string;
  address: string;
  cover_url: string | null;
  saved: boolean;
  // raw fields for saveEvent
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location_raw: string | null;
}

function formatEventDateTime(dateStr: string, startTime: string | null, endTime: string | null): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const datePart = `${mm}-${dd}-${yyyy}`;
  if (!startTime) return datePart;
  const fmt = (t: string) => {
    const [h] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12} ${period}`;
  };
  const end = endTime ? ` – ${fmt(endTime)}` : '';
  return `${datePart} | ${fmt(startTime)}${end}`;
}

function mapToCard(event: EventWithBusiness): PopUpEvent {
  return {
    id: event.id,
    title: event.event_name,
    business: event.business_name,
    time: formatEventDateTime(event.event_date, event.start_time, event.end_time),
    address: event.location ?? 'Location TBA',
    cover_url: event.cover_url,
    saved: isEventSaved(event.id),
    event_date: event.event_date,
    start_time: event.start_time,
    end_time: event.end_time,
    location_raw: event.location,
  };
}

// ─── Save Button ──────────────────────────────────────────────────────────────
const SaveBtn: React.FC<{ saved: boolean; onToggle: () => void }> = ({ saved, onToggle }) => (
  <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
    <Text style={[styles.heart, saved && styles.heartSaved]}>♥</Text>
  </TouchableOpacity>
);

// ─── Followed Card ────────────────────────────────────────────────────────────
const FollowedCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void; onPress: () => void }> = ({
  event, onToggleSave, onPress,
}) => (
  <TouchableOpacity style={styles.followedCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.followedCardImage}>
      {event.cover_url ? (
        <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
    </View>
    <View style={styles.followedCardBody}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.followedCardTitle} numberOfLines={1}>{event.title}</Text>
        <SaveBtn saved={event.saved} onToggle={onToggleSave} />
      </View>
      <Text style={styles.cardMeta}>{event.time}</Text>
      <Text style={styles.cardMeta}>{event.address}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Grid Card ────────────────────────────────────────────────────────────────
const GridCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void; onPress: () => void }> = ({
  event, onToggleSave, onPress,
}) => (
  <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.gridCardImage}>
      {event.cover_url ? (
        <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
    </View>
    <View style={styles.gridCardBody}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.gridCardTitle} numberOfLines={1}>{event.title}</Text>
        <SaveBtn saved={event.saved} onToggle={onToggleSave} />
      </View>
      <Text style={styles.cardMeta}>{event.time}</Text>
      <Text style={styles.cardMeta} numberOfLines={1}>{event.address}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Feature Card ─────────────────────────────────────────────────────────────
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
      <View style={styles.cardTitleRow}>
        <Text style={styles.featureCardTitle} numberOfLines={1}>{event.title}</Text>
        <SaveBtn saved={event.saved} onToggle={onToggleSave} />
      </View>
      <Text style={styles.cardMeta}>{event.time}</Text>
      <Text style={styles.cardMeta} numberOfLines={1}>{event.address}</Text>
    </View>
  </TouchableOpacity>
);

// ─── List Card ────────────────────────────────────────────────────────────────
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
      <Text style={styles.cardMeta}>{event.time}</Text>
      <Text style={styles.cardMeta} numberOfLines={1}>{event.address}</Text>
    </View>
    <SaveBtn saved={event.saved} onToggle={onToggleSave} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Explore() {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<PopUpEvent[]>([]);
  const [followedEvents, setFollowedEvents] = useState<PopUpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rows, bizList] = await Promise.all([
          listPublishedEvents(50),
          getFollowedBusinesses(),
        ]);
        if (!mounted) return;
        setEvents(rows.map(mapToCard));

        if (bizList.length > 0) {
          const eventArrays = await Promise.all(
            bizList.slice(0, 5).map((biz: Business) => getBusinessEvents(biz.uid, 3))
          );
          if (!mounted) return;
          const merged: PopUpEvent[] = eventArrays.flatMap((evts: EventRow[], i: number) =>
            evts.map((e: EventRow) => mapToCard({ ...e, business_name: bizList[i].business_name } as EventWithBusiness))
          );
          setFollowedEvents(merged.slice(0, 6));
        }
      } catch (err: any) {
        if (mounted) setErrorText(err?.message ?? 'Could not load events.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(e =>
      [e.title, e.business, e.time, e.address].some(v => v.toLowerCase().includes(q))
    );
  }, [events, search]);

  const uniqueEvents = useMemo(() => {
    const seen = new Set<number>();
    return filteredEvents.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
  }, [filteredEvents]);

  const nearYou = uniqueEvents.slice(0, 4);
  const forYou = uniqueEvents.slice(4, 6);
  const popular = uniqueEvents.slice(6);

  const toggleSave = (id: number) =>
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.saved) { unsaveEvent(id); } else { saveEvent({ id: e.id, event_name: e.title, event_date: e.event_date, start_time: e.start_time, end_time: e.end_time, location: e.location_raw, cover_url: e.cover_url, business_name: e.business }); }
      return { ...e, saved: !e.saved };
    }));

  const toggleFollowedSave = (id: number) =>
    setFollowedEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.saved) { unsaveEvent(id); } else { saveEvent({ id: e.id, event_name: e.title, event_date: e.event_date, start_time: e.start_time, end_time: e.end_time, location: e.location_raw, cover_url: e.cover_url, business_name: e.business }); }
      return { ...e, saved: !e.saved };
    }));

  const goToEvent = (id: number) =>
    router.push({ pathname: '/(tabs)/view_event', params: { eventId: String(id) } });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />
      <View style={styles.content}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Discover Pop-Ups</Text>
              <TouchableOpacity style={styles.settingsBtn} onPress={() => router.navigate('/(tabs)/settings')} activeOpacity={0.7}>
                <Text style={styles.settingsIcon}>⚙</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
              <Text style={styles.stateText}>Loading events...</Text>
            </View>
          ) : errorText ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : null}

          {!loading && followedEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>From vendors you follow</Text>
              {followedEvents.map(event => (
                <FollowedCard
                  key={`f-${event.id}`}
                  event={event}
                  onToggleSave={() => toggleFollowedSave(event.id)}
                  onPress={() => goToEvent(event.id)}
                />
              ))}
            </>
          )}

          {nearYou.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Events near you</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
                {nearYou.map(event => (
                  <GridCard
                    key={event.id}
                    event={event}
                    onToggleSave={() => toggleSave(event.id)}
                    onPress={() => goToEvent(event.id)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {forYou.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>We think you'll like</Text>
              {forYou.map(event => (
                <FeatureCard
                  key={event.id}
                  event={event}
                  onToggleSave={() => toggleSave(event.id)}
                  onPress={() => goToEvent(event.id)}
                />
              ))}
            </>
          )}

          {popular.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Popular in Austin</Text>
              <View style={styles.listCardContainer}>
                {popular.map((event, index) => (
                  <View key={event.id}>
                    <ListCard
                      event={event}
                      onToggleSave={() => toggleSave(event.id)}
                      onPress={() => goToEvent(event.id)}
                    />
                    {index < popular.length - 1 && <View style={styles.listDivider} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {!loading && uniqueEvents.length === 0 && !errorText && (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>No published events found.</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const CARD_BG = '#FFFFFF';
const RADIUS = 12;
const SHADOW = {
  shadowColor: '#000' as const,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  content: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  header: { paddingTop: 16, paddingBottom: 12, marginHorizontal: -16, paddingHorizontal: 16, backgroundColor: '#FFF1AD' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111' },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18, color: '#111' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: CARD_BG, borderRadius: 30,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 4,
  },
  searchIcon: { fontSize: 15, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 12, marginTop: 20 },
  centerState: { alignItems: 'center', justifyContent: 'center', marginBottom: 18, gap: 8 },
  stateText: { fontSize: 13, color: '#555' },
  errorText: { fontSize: 13, color: '#b91c1c', fontWeight: '600' },

  heart: { fontSize: 20, color: '#ccc' },
  heartSaved: { color: '#111' },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#666', marginBottom: 1 },

  // Followed card
  followedCard: {
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    marginBottom: 14, ...SHADOW,
  },
  followedCardImage: {
    width: '100%', height: 190, backgroundColor: '#bbb',
    overflow: 'hidden',
    borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS,
  },
  followedCardBody: { padding: 12 },
  followedCardTitle: { fontSize: 15, fontWeight: '800', color: '#111', flex: 1, marginRight: 8 },

  // Grid
  gridScroll: { gap: 10, paddingRight: 4, marginBottom: 22 },
  gridCard: {
    width: CARD_HALF, backgroundColor: CARD_BG, borderRadius: RADIUS, ...SHADOW,
  },
  gridCardImage: {
    width: '100%', height: 130, backgroundColor: '#bbb',
    overflow: 'hidden',
    borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS,
  },
  gridCardBody: { padding: 10 },
  gridCardTitle: { fontSize: 13, fontWeight: '800', color: '#111', flex: 1, marginRight: 6 },

  // Feature card
  featureCard: {
    backgroundColor: CARD_BG, borderRadius: RADIUS, marginBottom: 14, ...SHADOW,
  },
  featureCardImage: {
    width: '100%', height: 170, backgroundColor: '#bbb',
    overflow: 'hidden',
    borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS,
  },
  featureCardBody: { padding: 12 },
  featureCardTitle: { fontSize: 14, fontWeight: '800', color: '#111', flex: 1, marginRight: 8 },

  // List card
  listCardContainer: {
    backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 8, marginBottom: 20, ...SHADOW,
  },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4 },
  listCardImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#bbb', overflow: 'hidden' },
  listCardBody: { flex: 1 },
  listCardTitle: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 2 },
  listDivider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 4 },
});
