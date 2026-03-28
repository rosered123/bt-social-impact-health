import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ─── Star Rating ───
const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[{ fontSize: size }, i <= rating ? styles.starFilled : styles.starEmpty]}>
        ★
      </Text>
    ))}
  </View>
);

// ─── Review Item ───
const ReviewItem = ({ name, date }: { name: string; date: string }) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{name[0]}</Text>
      </View>
      <View style={styles.reviewMeta}>
        <Text style={styles.reviewName}>{name}</Text>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
    </View>
    <View style={styles.reviewBody}>
      <View style={styles.reviewLine} />
      <View style={[styles.reviewLine, { width: '70%' }]} />
    </View>
    <TouchableOpacity style={styles.replyBtn}>
      <Text style={styles.replyText}>Reply</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ───
export default function Profile() {
  const vibeTags = ['vibe tag', 'vibe tag', 'vibe tag'];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Text style={styles.headerTitle}>My Profile</Text>

        {/* ── Profile Hero ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarIcon}>📷</Text>
          </View>
          <Text style={styles.businessName}>Business Name</Text>

          <View style={styles.ratingRow}>
            <StarRating rating={5} size={16} />
            <Text style={styles.ratingText}> 5.0</Text>
            <Text style={styles.reviewCount}> (## reviews)</Text>
          </View>

          <Text style={styles.followersText}>#### followers</Text>

          <View style={styles.tagsRow}>
            {vibeTags.map((tag, i) => (
              <View key={i} style={styles.vibeTag}>
                <Text style={styles.vibeTagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filledBtn}>
              <Text style={styles.filledBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About ── */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.cardBody}>Short description about the business</Text>
        </View>

        {/* ── Our Story ── */}
        <Text style={styles.sectionTitle}>Our Story</Text>
        <View style={styles.card}>
          <Text style={styles.cardBody}>
            The business history, its story, where it started, what is special about the business, etc.
          </Text>
        </View>

        {/* ── Location & Contact ── */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.card}>
          <Text style={styles.contactText}>(123) 456-789</Text>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Visit Website</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Visit Website</Text>
          </TouchableOpacity>
        </View>

        {/* ── Upcoming Events ── */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventCard}>
          <View style={styles.eventImagePlaceholder} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>Event name</Text>
            <Text style={styles.eventDetail}>mm - dd - yyyy</Text>
            <Text style={styles.eventDetail}>Location</Text>
          </View>
        </View>

        {/* ── Recent Reviews ── */}
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <View style={styles.ratingSummary}>
          <StarRating rating={5} size={18} />
          <Text style={styles.ratingSummaryText}> 5.0</Text>
          <Text style={styles.ratingSummaryCount}> (##)</Text>
        </View>

        <ReviewItem name="Name" date="mm-dd-yyyy" />
        <ReviewItem name="Name" date="mm-dd-yyyy" />

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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', paddingTop: 16, marginBottom: 16 },

  // Hero
  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarIcon: { fontSize: 28 },
  businessName: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#111' },
  reviewCount: { fontSize: 13, color: '#777' },
  followersText: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 2, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  vibeTag: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  vibeTagText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  heroActions: { flexDirection: 'row', gap: 10, width: '100%' },
  outlineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingVertical: 10,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: '#333' },
  filledBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
  },
  filledBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Section
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },

  // Card
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 20 },
  cardBody: { fontSize: 14, color: '#444', lineHeight: 20 },

  // Contact
  contactText: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  linkRow: { marginBottom: 8 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#0a7ea4' },

  // Events
  eventCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 20,
  },
  eventImagePlaceholder: {
    height: 120,
    backgroundColor: '#ccc',
  },
  eventInfo: { padding: 14, gap: 4 },
  eventName: { fontSize: 15, fontWeight: '700', color: '#111' },
  eventDetail: { fontSize: 13, color: '#666' },

  // Rating Summary
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ratingSummaryText: { fontSize: 16, fontWeight: '800', color: '#111' },
  ratingSummaryCount: { fontSize: 14, color: '#777' },

  // Stars
  starsRow: { flexDirection: 'row', gap: 2 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ddd' },

  // Reviews
  reviewItem: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewBody: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  replyBtn: { alignSelf: 'flex-start' },
  replyText: { fontSize: 13, color: '#555', fontWeight: '600' },
});
