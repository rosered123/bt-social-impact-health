import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Image,
  Modal,
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
  getBusinessEvents,
  getBusinessTags,
  getMyProfile,
  isActiveEventStatus,
  listReviewsForBusiness,
  type Business,
  type EventRow,
  type ReviewRow,
  type VibeTag,
} from '@/services/api';
import { onEventsChanged, onProfileChanged } from '@/services/refresh-bus';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_REVIEWER_NAMES = [
  'Sarah Chen',
  'Mike Rodriguez',
  'Chloe Nguyen',
  'Alex Kim',
  'Jordan Lee',
];

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
const ReviewItem: React.FC<{ review: ReviewRow; index: number }> = ({ review, index }) => {
  const name = MOCK_REVIEWER_NAMES[index % MOCK_REVIEWER_NAMES.length];
  const initial = name.charAt(0);
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{initial}</Text>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewName}>{name}</Text>
          <StarRating rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      {review.body ? (
        <Text style={styles.reviewBody}>{review.body}</Text>
      ) : (
        <View style={styles.reviewLines}>
          <View style={styles.reviewLine} />
          <View style={[styles.reviewLine, { width: '65%' }]} />
        </View>
      )}
      <TouchableOpacity style={styles.replyBtn}>
        <Text style={styles.replyText}>↩  Reply</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: string; label: string; link?: boolean }> = ({ icon, label, link }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoLabel, link && styles.infoLabelLink]}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyProfile() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [businessTags, setBusinessTags] = useState<VibeTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      if (!profile) return;
      const [biz, evts, revs, tags] = await Promise.all([
        getBusinessByUid(profile.uid),
        getBusinessEvents(profile.uid, 20),
        listReviewsForBusiness(profile.uid, 5),
        getBusinessTags(profile.uid),
      ]);
      setBusiness(biz);
      setBusinessTags(tags);
      const upcoming = evts
        .filter(e => !isActiveEventStatus(e.status) && e.status !== 'closed' && e.status !== 'cancelled')
        .slice(0, 5);
      setEvents(upcoming);
      setReviews(revs);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const offProfile = onProfileChanged(loadProfile);
    const offEvents = onEventsChanged(loadProfile);
    return () => {
      offProfile();
      offEvents();
    };
  }, [loadProfile]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  const reviewCount = reviews.length;
  const avgRating = business?.avg_rating ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Golden Gradient Header ── */}
        <LinearGradient
          colors={['#f5d990', '#f0c060']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Text style={styles.pageTitle}>My Profile</Text>
        </LinearGradient>

        {/* ── Cover + Avatar ── */}
        <View style={styles.coverSection}>
          <View style={styles.coverPhoto}>
            {business?.logo_url ? (
              <Image source={{ uri: business.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={styles.coverPhotoIcon}>🖼</Text>
            )}
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {business?.logo_url ? (
                <Image source={{ uri: business.logo_url }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarIcon}>🖼</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Business Info ── */}
        <View style={styles.profileInfo}>
          <Text style={styles.businessName}>{business?.business_name ?? 'No Business Set Up'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starFilled}>★</Text>
              <Text style={styles.ratingText}> {Number(avgRating).toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</Text>
            </View>
            <Text style={styles.followersText}>{business?.follower_count ?? 0} followers</Text>
          </View>

          {/* ── Tag Pills ── */}
          {businessTags.length > 0 && (
            <View style={styles.tagRow}>
              {businessTags.map(tag => (
                <View key={tag.id} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/edit_profile?from=profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={() => { setLinkCopied(false); setShareVisible(true); }}>
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About Card ── */}
        <View style={styles.aboutCard}>
          <Text style={styles.cardSectionTitle}>About</Text>
          <Text style={styles.cardBody}>{business?.short_description ?? 'No description yet.'}</Text>

          {business?.story ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardSectionTitle}>Our Story</Text>
              <Text style={styles.cardBody}>{business.story}</Text>
            </>
          ) : null}

          <View style={styles.divider} />

          <InfoRow icon="📍" label="Austin, TX" />
          {business?.phone ? <InfoRow icon="📞" label={business.phone} /> : null}
          {business?.email ? <InfoRow icon="✉️" label={business.email} /> : null}
          {business?.website ? <InfoRow icon="🌐" label={business.website} link /> : null}

          {/* ── Social Media Icons ── */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <Feather name="instagram" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <Feather name="facebook" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
              <Feather name="music" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Upcoming Events ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View all &gt;</Text>
          </TouchableOpacity>
        </View>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events.</Text>
        ) : (
          events.map(event => (
            <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.8}>
              <View style={styles.eventThumb}>
                {event.cover_url ? (
                  <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.event_name}</Text>
                <View style={styles.eventMetaRow}>
                  <Text style={styles.eventMetaIcon}>📅</Text>
                  <Text style={styles.eventMetaText}>{event.event_date}</Text>
                </View>
                {event.location ? (
                  <View style={styles.eventMetaRow}>
                    <Text style={styles.eventMetaIcon}>📍</Text>
                    <Text style={styles.eventMetaText}>{event.location}</Text>
                  </View>
                ) : null}
                <Text style={styles.rsvpText}>87 RSVPs</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* ── Recent Reviews ── */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <View style={styles.reviewsRating}>
            <Text style={styles.starFilled}>★</Text>
            <Text style={styles.reviewsRatingText}> {Number(avgRating).toFixed(1)} ({reviewCount})</Text>
          </View>
        </View>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          reviews.map((review, idx) => (
            <ReviewItem key={review.id} review={review} index={idx} />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Share Profile Modal ── */}
      <Modal visible={shareVisible} transparent animationType="fade" onRequestClose={() => setShareVisible(false)}>
        <TouchableOpacity style={ms.overlay} activeOpacity={1} onPress={() => setShareVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={ms.card}>
            {/* Cover photo background */}
            <View style={ms.coverBg}>
              {business?.logo_url ? (
                <Image source={{ uri: business.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : null}
              <View style={ms.coverDarken} />

              {/* Close button top-right */}
              <TouchableOpacity
                style={ms.shareIcon}
                activeOpacity={0.7}
                onPress={() => setShareVisible(false)}
              >
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Avatar */}
              <View style={ms.avatarWrap}>
                {business?.logo_url ? (
                  <Image source={{ uri: business.logo_url }} style={ms.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={ms.avatarPlaceholder}>
                    <Text style={{ fontSize: 28, opacity: 0.5 }}>🖼</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info section */}
            <View style={ms.infoSection}>
              <Text style={ms.name}>{business?.business_name ?? 'My Business'}</Text>
              <Text style={ms.description}>{business?.short_description ?? 'No description yet.'}</Text>

              {/* Bottom row: followers, rating, copy link */}
              <View style={ms.bottomRow}>
                <View style={ms.statItem}>
                  <Feather name="users" size={14} color="#555" />
                  <Text style={ms.statValue}>{business?.follower_count ?? 0}</Text>
                </View>
                <View style={ms.statItem}>
                  <Text style={{ color: '#f59e0b', fontSize: 14 }}>★</Text>
                  <Text style={ms.statValue}>{Number(avgRating).toFixed(1)}</Text>
                </View>
                <TouchableOpacity
                  style={[ms.copyBtn, linkCopied && ms.copyBtnDone]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Clipboard.setString(business?.website ?? '');
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                >
                  <Feather name={linkCopied ? 'check' : 'link'} size={13} color="#333" />
                  <Text style={[ms.copyBtnText, linkCopied && ms.copyBtnTextDone]}>
                    {linkCopied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 16, paddingHorizontal: 16 },

  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#111' },

  coverSection: { marginBottom: 0, paddingHorizontal: 16 },
  coverPhoto: {
    height: 150, backgroundColor: '#e8e8e8', borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center', marginTop: 14, overflow: 'hidden',
  },
  coverPhotoIcon: { fontSize: 28, opacity: 0.5 },
  avatarWrapper: { marginTop: -36, marginLeft: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#d0d0d0',
    borderWidth: 3, borderColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 22, opacity: 0.5 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 36 },

  profileInfo: { paddingTop: 8, paddingHorizontal: 16, marginBottom: 16 },
  businessName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#444', fontWeight: '500' },
  followersText: { fontSize: 13, color: '#444', fontWeight: '600' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagPill: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f5d990',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { fontSize: 12, color: '#333', fontWeight: '500' },

  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1, backgroundColor: '#2e4a7a', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  editBtnText: { color: '#e8e8e8', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    flex: 1, backgroundColor: '#98b2ce', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  shareBtnText: { color: '#333', fontWeight: '700', fontSize: 14 },

  aboutCard: {
    backgroundColor: '#e8e8e8', borderRadius: RADIUS, padding: 16,
    marginBottom: 20, marginHorizontal: 16,
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  infoIcon: { fontSize: 15, width: 22 },
  infoLabel: { fontSize: 13, color: '#444' },
  infoLabelLink: { color: '#4f7df0', fontWeight: '500' },

  socialRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  socialIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  viewAllText: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },

  eventCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS,
    padding: 12, marginBottom: 14, gap: 12, alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventThumb: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e8e8e8', overflow: 'hidden' },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontSize: 14, fontWeight: '800', color: '#111' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaIcon: { fontSize: 12 },
  eventMetaText: { fontSize: 12, color: '#666' },
  rsvpText: { fontSize: 11, color: '#f59e0b', fontWeight: '600', marginTop: 2 },

  reviewsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, marginTop: 6, paddingHorizontal: 16,
  },
  reviewsRating: { flexDirection: 'row', alignItems: 'center' },
  reviewsRatingText: { fontSize: 14, fontWeight: '700', color: '#333' },

  reviewItem: {
    backgroundColor: '#fff', borderRadius: RADIUS, padding: 14, marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5d990',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewAvatarText: { fontWeight: '700', color: '#333', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewBody: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 10 },
  reviewLines: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#e8e8e8', borderRadius: 4, width: '100%' },
  replyBtn: {},
  replyText: { fontSize: 13, color: '#555', fontWeight: '600' },

  starsRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
  starFilled: { color: '#f59e0b', fontSize: 13 },
  starEmpty: { color: '#ddd', fontSize: 13 },
});

// ─── Share Modal Styles ───────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    width: '80%', borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  coverBg: {
    height: 260, justifyContent: 'flex-end', alignItems: 'center',
  },
  coverDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  shareIcon: {
    position: 'absolute', top: 14, right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrap: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden', marginBottom: -50,
    backgroundColor: '#d0d0d0',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#d0d0d0',
  },

  infoSection: {
    paddingTop: 58, paddingBottom: 20, paddingHorizontal: 16,
    alignItems: 'center',
  },
  name: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 4, textAlign: 'center' },
  description: { fontSize: 13, color: '#555', lineHeight: 19, textAlign: 'center', marginBottom: 14 },

  bottomRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#333' },

  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f5f5f5', borderRadius: 20, borderWidth: 1, borderColor: '#ddd',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },
  copyBtnDone: { backgroundColor: '#fef3c7', borderColor: '#f5d990' },
  copyBtnTextDone: { color: '#333' },
});
