import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HALF = (SCREEN_WIDTH - 16 * 2 - 10) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PopUpEvent {
  id: string;
  title: string;
  business: string;
  time: string;
  address: string;
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
const GridCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void }> = ({
  event, onToggleSave,
}) => (
  <View style={styles.gridCard}>
    <View style={styles.gridCardImage}>
      <SaveBtn saved={event.saved} onToggle={onToggleSave} />
    </View>
    <View style={styles.gridCardBody}>
      <Text style={styles.gridCardTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.gridCardSub} numberOfLines={1}>{event.business}</Text>
      <Text style={styles.gridCardSub} numberOfLines={1}>{event.time}</Text>
      <Text style={styles.gridCardSub} numberOfLines={1}>{event.address}</Text>
    </View>
  </View>
);

// ─── Feature Card (We think you'll like) ─────────────────────────────────────
const FeatureCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void }> = ({
  event, onToggleSave,
}) => (
  <View style={styles.featureCard}>
    <View style={styles.featureCardImage} />
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
  </View>
);

// ─── List Card (Popular in Austin) ───────────────────────────────────────────
const ListCard: React.FC<{ event: PopUpEvent; onToggleSave: () => void }> = ({
  event, onToggleSave,
}) => (
  <View style={styles.listCard}>
    <View style={styles.listCardImage} />
    <View style={styles.listCardBody}>
      <Text style={styles.listCardTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.listCardSub} numberOfLines={1}>{event.business}</Text>
      <Text style={styles.listCardSub} numberOfLines={1}>
        {event.time} | {event.address}
      </Text>
    </View>
    <SaveBtn saved={event.saved} onToggle={onToggleSave} dark />
  </View>
);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const makeEvent = (id: string): PopUpEvent => ({
  id,
  title: 'Matcha Pop-up',
  business: 'Business Name',
  time: 'Thursday, 4 PM',
  address: 'Address',
  saved: false,
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Explore() {
  const [search, setSearch] = useState('');

  const [nearYou, setNearYou] = useState<PopUpEvent[]>([
    makeEvent('n1'), makeEvent('n2'),
  ]);
  const [forYou, setForYou] = useState<PopUpEvent[]>([
    makeEvent('f1'), makeEvent('f2'),
  ]);
  const [popular, setPopular] = useState<PopUpEvent[]>([
    makeEvent('p1'), makeEvent('p2'), makeEvent('p3'),
  ]);

  const toggleSave = (
    list: PopUpEvent[],
    setList: React.Dispatch<React.SetStateAction<PopUpEvent[]>>,
    id: string,
  ) => {
    setList(prev => prev.map(e => e.id === id ? { ...e, saved: !e.saved } : e));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
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
              onToggleSave={() => toggleSave(nearYou, setNearYou, event.id)}
            />
          ))}
        </ScrollView>

        {/* ── We Think You'll Like ── */}
        <Text style={styles.sectionTitle}>We think you'll like</Text>
        {forYou.map(event => (
          <FeatureCard
            key={event.id}
            event={event}
            onToggleSave={() => toggleSave(forYou, setForYou, event.id)}
          />
        ))}

        {/* ── Popular in Austin ── */}
        <Text style={styles.sectionTitle}>Popular in Austin</Text>
        <View style={styles.card}>
          {popular.map((event, index) => (
            <View key={event.id}>
              <ListCard
                event={event}
                onToggleSave={() => toggleSave(popular, setPopular, event.id)}
              />
              {index < popular.length - 1 && <View style={styles.listDivider} />}
            </View>
          ))}
        </View>

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
  header: { paddingTop: 16, marginBottom: 12 },
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
  listCardImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#bbb' },
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