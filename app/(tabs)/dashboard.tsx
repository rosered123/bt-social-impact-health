import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ─── Icon placeholders (swap with react-native-vector-icons or lucide-react-native) ───
const Icon = ({ name, size = 20, color = '#222' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    chart: '📊', people: '👥', events: '⚡', star: '⭐',
    calendar: '📅', handshake: '🤝', offer: '🎁', analytics: '📈',
    camera: '📷', chat: '💬', settings: '⚙️', wifi: '📡', eye: '👁', edit: '✏️',
    reply: '↩', 'star-filled': '★', 'star-empty': '☆',
  };
  return <Text style={{ fontSize: size }}>{icons[name] ?? '●'}</Text>;
};

// ─── Star Rating ───
const StarRating = ({ rating }: { rating: number }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>
        ★
      </Text>
    ))}
  </View>
);

// ─── Stat Card ───
const StatCard = ({
  icon, value, label, sub,
}: { icon: string; value: string; label: string; sub: string }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={22} color="#333" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statSub}>{sub}</Text>
  </View>
);

// ─── Action Card ───
const ActionCard = ({
  icon, label, sub, onPress,
}: { icon: string; label: string; sub: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
    <Icon name={icon} size={22} color="#333" />
    <Text style={styles.actionLabel}>{label}</Text>
    <Text style={styles.actionSub}>{sub}</Text>
  </TouchableOpacity>
);

// ─── Review Item ───
const ReviewItem = ({
  name, date, rating, preview,
}: { name: string; date: string; rating: number; preview: string }) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{name[0]}</Text>
      </View>
      <View style={styles.reviewMeta}>
        <Text style={styles.reviewName}>{name}</Text>
        <StarRating rating={rating} />
      </View>
      <Text style={styles.reviewDate}>{date}</Text>
    </View>
    <View style={styles.reviewBody}>
      <View style={styles.reviewLine} />
      <View style={[styles.reviewLine, { width: '70%' }]} />
    </View>
    <TouchableOpacity style={styles.replyBtn}>
      <Text style={styles.replyText}>↩  Reply</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ───
export default function BusinessDashboard() {
  const [status] = useState<'open' | 'closed'>('open');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Business Dashboard</Text>
            <Text style={styles.headerTitle}>Hey, Business Name 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}><Icon name="chat" size={18} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Icon name="settings" size={18} /></TouchableOpacity>
          </View>
        </View>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileAvatar}>
              <Icon name="camera" size={20} color="#666" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Business name</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.starFilled}>★</Text>
                <Text style={styles.profileRating}> 4.8/5</Text>
                <Text style={styles.profileReviews}> (142 reviews)</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.outlineBtn}>
              <Icon name="eye" size={14} color="#333" />
              <Text style={styles.outlineBtnText}> View Public Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filledBtn}>
              <Icon name="edit" size={14} color="#fff" />
              <Text style={styles.filledBtnText}> Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Right Now ── */}
        <Text style={styles.sectionTitle}>📡  Right Now</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>CURRENT STATUS</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>OPEN NOW</Text>
            <TouchableOpacity style={styles.updateBtn}>
              <Text style={styles.updateBtnText}>Update →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.statusSub}>Pop-up name · location</Text>
        </View>

        {/* ── Today's Activity ── */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.grid}>
          <StatCard icon="eye" value="####" label="Profile View" sub="+##% this week" />
          <StatCard icon="people" value="####" label="Followers" sub="+##% this week" />
          <StatCard icon="events" value="##" label="My Events" sub="" />
          <StatCard icon="star" value="4.8/5" label="Average Rating" sub="### reviews" />
        </View>

        {/* ── More Actions ── */}
        <Text style={styles.sectionTitle}>More Actions</Text>
        <View style={styles.grid}>
          <ActionCard icon="calendar" label="Create Event" sub="New pop-up" />
          <ActionCard icon="handshake" label="Collaborate" sub="Partner up" />
          <ActionCard icon="offer" label="Create Offer" sub="Special deals" />
          <ActionCard icon="analytics" label="View Analytics" sub="Insights & data" />
        </View>

        {/* ── Recent Reviews ── */}
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <ReviewItem name="Name" date="mm-dd-yyyy" rating={5} preview="" />
        <ReviewItem name="Name" date="mm-dd-yyyy" rating={3} preview="" />
        <ReviewItem name="Name" date="mm-dd-yyyy" rating={4} preview="" />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───
const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 16 },
  headerSub: { fontSize: 12, color: '#666', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },

  // Profile Card
  profileCard: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700', color: '#111' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  profileRating: { fontSize: 12, fontWeight: '600', color: '#333' },
  profileReviews: { fontSize: 12, color: '#777' },
  profileActions: { flexDirection: 'row', gap: 8 },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#bbb', borderRadius: 8, paddingVertical: 8 },
  outlineBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
  filledBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', borderRadius: 8, paddingVertical: 8 },
  filledBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  // Section Title
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },

  // Status Card
  statusCard: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 8 },
  statusText: { fontSize: 20, fontWeight: '900', color: '#111', flex: 1 },
  updateBtn: { backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  updateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statusSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },

  // Stat Card
  statCard: {
    width: '47.5%', backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 14, gap: 3,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  statSub: { fontSize: 11, color: '#777' },

  // Action Card
  actionCard: {
    width: '47.5%', backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 14, gap: 4,
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 4 },
  actionSub: { fontSize: 11, color: '#777' },

  // Stars
  starsRow: { flexDirection: 'row', gap: 1 },
  star: { fontSize: 13 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ddd' },

  // Reviews
  reviewItem: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewBody: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  replyBtn: { flexDirection: 'row', alignItems: 'center' },
  replyText: { fontSize: 13, color: '#555', fontWeight: '600' },
});