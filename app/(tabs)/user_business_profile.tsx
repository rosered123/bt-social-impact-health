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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface Review {
  id: string;
  name: string;
  date: string;
  rating: number;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[{ fontSize: size }, i <= rating ? styles.starFilled : styles.starEmpty]}>
        ★
      </Text>
    ))}
  </View>
);

// ─── Review Item ──────────────────────────────────────────────────────────────
const ReviewItem: React.FC<{ review: Review }> = ({ review }) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{review.name[0]}</Text>
      </View>
      <View style={styles.reviewMeta}>
        <Text style={styles.reviewName}>{review.name}</Text>
        <StarRating rating={review.rating} />
      </View>
      <Text style={styles.reviewDate}>{review.date}</Text>
    </View>
    <View style={styles.reviewLines}>
      <View style={styles.reviewLine} />
      <View style={[styles.reviewLine, { width: '65%' }]} />
    </View>
    <TouchableOpacity style={styles.replyBtn}>
      <Text style={styles.replyText}>↩  Reply</Text>
    </TouchableOpacity>
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; label: string; onPress?: () => void; link?: boolean }> = ({
  icon, label, onPress, link,
}) => (
  <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoLabel, link && styles.infoLabelLink]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SAMPLE_EVENTS: Event[] = [
  { id: '1', name: 'Event name', date: 'mm - dd - yyyy', location: 'Location' },
];

const SAMPLE_REVIEWS: Review[] = [
  { id: '1', name: 'Name', date: 'mm-dd-yyyy', rating: 5 },
  { id: '2', name: 'Name', date: 'mm-dd-yyyy', rating: 3 },
];

export default function MyProfile() {
  const [following, setFollowing] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header Title ── */}
        <Text style={styles.pageTitle}>My Profile</Text>

        {/* ── Cover + Avatar ── */}
        <View style={styles.coverSection}>
          <View style={styles.coverPhoto}>
            <Text style={styles.coverPhotoIcon}>🖼</Text>
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>🖼</Text>
            </View>
          </View>
        </View>

        {/* ── Business Info ── */}
        <View style={styles.profileInfo}>
          <Text style={styles.businessName}>Business Name</Text>

          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starFilled}>★</Text>
              <Text style={styles.ratingText}> 5.0 (## reviews)</Text>
            </View>
            <Text style={styles.followersText}>#### followers</Text>
          </View>

          {/* Vibe Tags */}
          <View style={styles.tagsRow}>
            {['vibe tag', 'vibe tag', 'vibe tag'].map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={() => setFollowing(f => !f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>About</Text>
          <Text style={styles.cardBody}>Short description about the business</Text>

          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Our Story</Text>
          <Text style={styles.cardBody}>
            The business history, its story, where it started, what is special about the business, etc.
          </Text>

          <View style={styles.divider} />

          <InfoRow icon="📍" label="Location" />
          <InfoRow icon="📞" label="(123) 456-789" />
          <InfoRow icon="✉️" label="Visit Website" link />
          <InfoRow icon="🌐" label="Visit Website" link />

          {/* Social Icons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIcon}>
              <Text style={styles.socialIconText}>𝕀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Text style={styles.socialIconText}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Text style={styles.socialIconText}>♪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Upcoming Events ── */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {SAMPLE_EVENTS.map(event => (
          <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.8}>
            <View style={styles.eventThumb} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{event.name}</Text>
              <View style={styles.eventMetaRow}>
                <Text style={styles.eventMetaIcon}>📅</Text>
                <Text style={styles.eventMetaText}>{event.date}</Text>
              </View>
              <View style={styles.eventMetaRow}>
                <Text style={styles.eventMetaIcon}>📍</Text>
                <Text style={styles.eventMetaText}>{event.location}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Recent Reviews ── */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <View style={styles.reviewsRating}>
            <Text style={styles.starFilled}>★</Text>
            <Text style={styles.reviewsRatingText}> 5.0 (##)</Text>
          </View>
        </View>

        {SAMPLE_REVIEWS.map(review => (
          <ReviewItem key={review.id} review={review} />
        ))}

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

  pageTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 16, marginBottom: 14 },

  // Cover + Avatar
  coverSection: { marginBottom: 0 },
  coverPhoto: {
    height: 150, backgroundColor: CARD_BG, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
  },
  coverPhotoIcon: { fontSize: 28, opacity: 0.5 },
  avatarWrapper: { marginTop: -36, marginLeft: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#d0d0d0',
    borderWidth: 3, borderColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 22, opacity: 0.5 },

  // Profile Info
  profileInfo: { paddingTop: 8, marginBottom: 16 },
  businessName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#444', fontWeight: '500' },
  followersText: { fontSize: 13, color: '#444', fontWeight: '600' },

  // Tags
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  tag: {
    borderWidth: 1.5, borderColor: '#bbb', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#f0f0f0',
  },
  tagText: { fontSize: 12, color: '#444' },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, backgroundColor: '#555', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  followingBtn: { backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#bbb' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followingBtnText: { color: '#333' },
  shareBtn: {
    flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ccc',
  },
  shareBtnText: { color: '#333', fontWeight: '700', fontSize: 14 },

  // Card
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 16, marginBottom: 20 },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },

  // Info Rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  infoIcon: { fontSize: 15, width: 22 },
  infoLabel: { fontSize: 13, color: '#444' },
  infoLabelLink: { color: '#4f7df0', fontWeight: '500' },

  // Social
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  socialIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  socialIconText: { fontSize: 16, fontWeight: '700', color: '#333' },

  // Section titles
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 12 },

  // Events
  eventCard: {
    flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 12, marginBottom: 14, gap: 12, alignItems: 'center',
  },
  eventThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#c8c8c8' },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontSize: 14, fontWeight: '800', color: '#111' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaIcon: { fontSize: 12 },
  eventMetaText: { fontSize: 12, color: '#666' },

  // Reviews
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reviewsRating: { flexDirection: 'row', alignItems: 'center' },
  reviewsRatingText: { fontSize: 14, fontWeight: '700', color: '#333' },

  reviewItem: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#bbb',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewLines: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  replyBtn: {},
  replyText: { fontSize: 13, color: '#555', fontWeight: '600' },

  // Stars
  starsRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
  starFilled: { color: '#f59e0b', fontSize: 13 },
  starEmpty: { color: '#ddd', fontSize: 13 },
});