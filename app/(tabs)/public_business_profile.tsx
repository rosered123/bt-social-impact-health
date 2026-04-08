import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';

import {
  getBusinessByUid,
  getBusinessEvents,
  getMyProfile,
  listReviewsForBusiness,
  type Business,
  type EventRow,
  type Profile,
  type ReviewRow,
} from '@/services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatEventDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};

const formatTimeRange = (start: string | null, end: string | null): string => {
  if (!start && !end) return '';
  const fmt = (t: string | null) => {
    if (!t) return '';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr ?? '0', 10);
    if (Number.isNaN(h)) return t;
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = ((h + 11) % 12) + 1;
    return m === 0 ? `${hr} ${period}` : `${hr}:${String(m).padStart(2, '0')} ${period}`;
  };
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s}–${e}`;
  return s || e;
};

// ─── Subcomponents ──────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text
        key={i}
        style={[{ fontSize: size }, i <= rating ? styles.starFilled : styles.starEmpty]}
      >
        ★
      </Text>
    ))}
  </View>
);

const ReviewItem: React.FC<{ review: ReviewRow }> = ({ review }) => {
  const initial = review.reviewer_uid.slice(0, 1).toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{initial}</Text>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewName}>Customer</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <StarRating rating={review.rating} />
      </View>
      {review.body ? (
        <Text style={styles.reviewBodyText}>{review.body}</Text>
      ) : (
        <View style={styles.reviewLines}>
          <View style={styles.reviewLine} />
          <View style={[styles.reviewLine, { width: '65%' }]} />
        </View>
      )}
      <TouchableOpacity style={styles.replyBtn} activeOpacity={0.75}>
        <Text style={styles.replyBtnText}>↩ Reply</Text>
      </TouchableOpacity>
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; link?: boolean }> = ({
  icon,
  label,
  link,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoLabel, link && styles.infoLabelLink]}>{label}</Text>
  </View>
);

// ─── Page ───────────────────────────────────────────────────────────────────
export default function PublicBusinessProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p || cancelled) return;
        setProfile(p);
        const [biz, evts, revs] = await Promise.all([
          getBusinessByUid(p.uid),
          getBusinessEvents(p.uid),
          listReviewsForBusiness(p.uid),
        ]);
        if (cancelled) return;
        setBusiness(biz);
        setEvents(evts);
        setReviews(revs);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  if (error || !business) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { paddingHorizontal: 24 }]}>
        <Text style={styles.errorText}>{error ?? 'Business not found.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const avgRating =
    business.avg_rating != null ? Number(business.avg_rating).toFixed(1) : '—';
  const followerCount = business.follower_count ?? 0;
  const vibeTags = ['vibe tag', 'vibe tag', 'vibe tag']; // TODO: wire to real tags when API exists

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            activeOpacity={0.75}
            onPress={() => router.back()}
          >
            <Text style={styles.headerBackIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Business Profile</Text>
          <View style={styles.headerBackBtn} />
        </View>

        {/* ── Cover + Avatar ── */}
        <View style={styles.coverSection}>
          <View style={styles.coverPhoto}>
            {business.logo_url ? (
              <Image
                source={{ uri: business.logo_url }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.coverPhotoIcon}>🖼</Text>
            )}
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {business.logo_url ? (
                <Image
                  source={{ uri: business.logo_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarIcon}>🖼</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Profile Info ── */}
        <View style={styles.profileInfo}>
          <Text style={styles.businessName}>{business.business_name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starFilled}>★</Text>
              <Text style={styles.ratingText}> {avgRating} ({reviews.length} reviews)</Text>
            </View>
            <Text style={styles.followersText}>{followerCount} followers</Text>
          </View>

          {/* ── Vibe Tags ── */}
          <View style={styles.tagsRow}>
            {vibeTags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* ── Actions ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.followBtn} activeOpacity={0.8}>
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About + Story + Contact Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>About</Text>
          <Text style={styles.cardBody}>
            {business.short_description ?? 'Short description about the business'}
          </Text>
          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Our Story</Text>
          <Text style={styles.cardBody}>
            {business.story ??
              'The business history, its story, where it started, what is special about the business, etc.'}
          </Text>
          <View style={styles.divider} />

          <InfoRow icon="📍" label={profile?.location ?? 'Location'} />
          <InfoRow icon="📞" label={business.phone ?? '(123) 456-789'} />
          {business.website ? (
            <InfoRow icon="🌐" label={business.website} link />
          ) : (
            <InfoRow icon="🌐" label="Visit Website" link />
          )}
          {business.email ? <InfoRow icon="✉️" label={business.email} link /> : null}
        </View>

        {/* ── Upcoming Events ── */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events yet.</Text>
        ) : (
          events.map(event => {
            const dateStr = formatEventDate(event.event_date);
            const timeStr = formatTimeRange(event.start_time, event.end_time);
            const dateTime = [dateStr, timeStr].filter(Boolean).join('  |  ');
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventThumb}>
                  {event.cover_url ? (
                    <Image
                      source={{ uri: event.cover_url }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.eventThumbIcon}>🖼</Text>
                  )}
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{event.event_name}</Text>
                  {dateTime ? <Text style={styles.eventMeta}>{dateTime}</Text> : null}
                  <Text style={styles.eventMeta}>{event.location ?? 'Location'}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* ── Recent Reviews ── */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <View style={styles.reviewsRating}>
            <Text style={styles.starFilled}>★</Text>
            <Text style={styles.reviewsRatingText}> {avgRating} ({reviews.length})</Text>
          </View>
        </View>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          reviews.slice(0, 5).map(r => <ReviewItem key={r.id} review={r} />)
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  backBtn: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#333', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '700' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackIcon: { fontSize: 22, fontWeight: '700', color: '#333', marginTop: -2 },
  pageTitle: { fontSize: 20, fontWeight: '900', color: '#111' },

  coverSection: { marginBottom: 0 },
  coverPhoto: {
    height: 150,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverPhotoIcon: { fontSize: 28, opacity: 0.5 },
  avatarWrapper: { marginTop: -36, marginLeft: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#d0d0d0',
    borderWidth: 3,
    borderColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: { fontSize: 22, opacity: 0.5 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 36 },

  profileInfo: { paddingTop: 8, marginBottom: 18 },
  businessName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#444', fontWeight: '500' },
  followersText: { fontSize: 13, color: '#444', fontWeight: '600' },

  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  tag: {
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#f0f0f0',
  },
  tagText: { fontSize: 12, color: '#444', fontWeight: '500' },

  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1,
    backgroundColor: '#555',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
  },
  shareBtnText: { color: '#333', fontWeight: '700', fontSize: 14 },

  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 16, marginBottom: 20 },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  infoIcon: { fontSize: 15, width: 22 },
  infoLabel: { fontSize: 13, color: '#444' },
  infoLabelLink: { color: '#4f7df0', fontWeight: '500' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 12 },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 12,
    marginBottom: 14,
    gap: 12,
    alignItems: 'center',
  },
  eventThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#c8c8c8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eventThumbIcon: { fontSize: 20, opacity: 0.5 },
  eventInfo: { flex: 1, gap: 3 },
  eventName: { fontSize: 14, fontWeight: '800', color: '#111' },
  eventMeta: { fontSize: 12, color: '#666' },

  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewsRating: { flexDirection: 'row', alignItems: 'center' },
  reviewsRatingText: { fontSize: 14, fontWeight: '700', color: '#333' },

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
  reviewDate: { fontSize: 11, color: '#999', marginTop: 1 },
  reviewBodyText: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 8 },
  reviewLines: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  replyBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  replyBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },

  starsRow: { flexDirection: 'row', gap: 1 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ddd' },

  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },
});
