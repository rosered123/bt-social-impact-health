import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  price: string;
  stock: 'Full stock' | 'Low stock' | 'Out of stock';
}

interface CustomerTag {
  id: string;
  label: string;
  percent: number;
}

interface VibeTag {
  id: string;
  emoji: string;
  label: string;
}

// ─── Stock Badge ──────────────────────────────────────────────────────────────
const StockBadge: React.FC<{ stock: MenuItem['stock'] }> = ({ stock }) => {
  const color =
    stock === 'Full stock' ? '#22c55e' :
    stock === 'Low stock' ? '#f59e0b' : '#ef4444';
  return <Text style={[styles.stockBadge, { color }]}>{stock}</Text>;
};

// ─── Customer Tag Row ─────────────────────────────────────────────────────────
const CustomerTagRow: React.FC<{ tag: CustomerTag }> = ({ tag }) => (
  <View style={styles.customerTagRow}>
    <Text style={styles.customerTagLabel}>{tag.label}</Text>
    <View style={styles.customerTagBarWrap}>
      <View style={[styles.customerTagBar, { width: `${tag.percent}%` }]} />
    </View>
    <Text style={styles.customerTagPercent}>{tag.percent}%</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const VIBE_TAGS: VibeTag[] = [
  { id: '1', emoji: '🌱', label: 'Vegan' },
  { id: '2', emoji: '🍵', label: 'Matcha' },
  { id: '3', emoji: '📍', label: 'Local' },
  { id: '4', emoji: '✨', label: 'Pop-up' },
];

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Product 1', price: 'Price', stock: 'Full stock' },
  { id: '2', name: 'Product 2', price: 'Price', stock: 'Low stock' },
  { id: '3', name: 'Product 3', price: 'Price', stock: 'Full stock' },
];

const CUSTOMER_TAGS: CustomerTag[] = [
  { id: '1', label: 'Quick Service', percent: 67 },
  { id: '2', label: 'Crowded', percent: 45 },
  { id: '3', label: 'Lively', percent: 25 },
];

export default function ViewEvent() {
  const [saved, setSaved] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Cover Image ── */}
        <View style={styles.coverImage}>
          {/* Back + Save buttons overlaid on cover */}
          <View style={styles.coverActions}>
            <TouchableOpacity style={styles.coverBtn}>
              <Text style={styles.coverBtnText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.coverBtn} onPress={() => setSaved(s => !s)}>
              <Text style={styles.coverBtnText}>{saved ? '🔖' : '📌'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── Event Header ── */}
          <Text style={styles.eventTitle}>Matcha Pop-up</Text>
          <Text style={styles.eventMeta}>Thursday, 4 PM</Text>
          <Text style={styles.eventMeta}>Address</Text>
          <TouchableOpacity>
            <Text style={styles.businessName}>Business Name</Text>
          </TouchableOpacity>

          {/* ── Vibe Tags ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
            contentContainerStyle={styles.tagsContent}
          >
            {VIBE_TAGS.map(tag => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.emoji} {tag.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ── Action Buttons ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Add Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* ── Event Overview ── */}
          <Text style={styles.sectionTitle}>Event Overview from business</Text>
          <View style={styles.overviewBox}>
            {/* Placeholder for description text */}
            <View style={styles.placeholderLine} />
            <View style={styles.placeholderLine} />
            <View style={[styles.placeholderLine, { width: '60%' }]} />
          </View>

          {/* ── Push Notification Banner ── */}
          <View style={styles.notifBanner}>
            <Text style={styles.notifBannerText}>pushed notifications from business</Text>
          </View>

          {/* ── Menu ── */}
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.card}>
            {MENU_ITEMS.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.menuRow,
                  index < MENU_ITEMS.length - 1 && styles.menuRowBorder,
                ]}
              >
                <Text style={styles.menuName}>{item.name} - {item.price}</Text>
                <StockBadge stock={item.stock} />
              </View>
            ))}
            <Text style={styles.updatedText}>Updated [time]</Text>
          </View>

          {/* ── What Customers Are Saying ── */}
          <Text style={styles.sectionTitle}>What customers are saying</Text>
          <View style={styles.card}>
            {CUSTOMER_TAGS.map(tag => (
              <CustomerTagRow key={tag.id} tag={tag} />
            ))}
            <Text style={styles.updatedText}>Updated [time]</Text>
          </View>

        </View>
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
  scroll: { flex: 1 },

  // Cover
  coverImage: {
    width: SCREEN_WIDTH,
    height: 220,
    backgroundColor: '#d0d0d0',
    justifyContent: 'space-between',
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

  // Body
  body: { paddingHorizontal: 16, paddingTop: 16 },

  // Header
  eventTitle: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 4 },
  eventMeta: { fontSize: 13, color: '#666', marginBottom: 2 },
  businessName: {
    fontSize: 15, fontWeight: '700', color: '#333',
    marginTop: 6, marginBottom: 12,
    textDecorationLine: 'underline',
  },

  // Tags
  tagsScroll: { marginBottom: 14 },
  tagsContent: { gap: 8, paddingRight: 16 },
  tag: {
    borderWidth: 1.5, borderColor: '#bbb', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f0f0',
  },
  tagText: { fontSize: 12, color: '#444', fontWeight: '500' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#bbb', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#f0f0f0',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },

  // Overview
  overviewBox: { marginBottom: 16, gap: 8 },
  placeholderLine: { height: 10, backgroundColor: '#ddd', borderRadius: 5, width: '100%' },

  // Notif Banner
  notifBanner: {
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', marginBottom: 20,
  },
  notifBannerText: { fontSize: 13, color: '#555', fontWeight: '500' },

  // Card
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },

  // Menu
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 10,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#d5d5d5' },
  menuName: { fontSize: 13, color: '#333', fontWeight: '500' },
  stockBadge: { fontSize: 12, fontWeight: '700' },
  updatedText: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 8 },

  // Customer Tags
  customerTagRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#d5d5d5', gap: 10,
  },
  customerTagLabel: { width: 110, fontSize: 13, color: '#333', fontWeight: '500' },
  customerTagBarWrap: {
    flex: 1, height: 8, backgroundColor: '#d0d0d0', borderRadius: 4, overflow: 'hidden',
  },
  customerTagBar: { height: '100%', backgroundColor: '#555', borderRadius: 4 },
  customerTagPercent: { width: 36, fontSize: 12, fontWeight: '700', color: '#555', textAlign: 'right' },
});