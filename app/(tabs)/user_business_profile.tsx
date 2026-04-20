import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  followBusiness,
  getBusinessByUid,
  getBusinessEvents,
  isFollowing,
  listReviewsForBusiness,
  unfollowBusiness,
  type Business,
  type EventRow,
  type ReviewRow,
} from '@/services/api';

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text key={i} style={[{ fontSize: size }, i <= rating ? styles.starFilled : styles.starEmpty]}>★</Text>
    ))}
  </View>
);

const ReviewItem: React.FC<{ review: ReviewRow }> = ({ review }) => {
  const initial = (review.reviewer_display_name ?? review.reviewer_uid).slice(0, 1).toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          {review.reviewer_avatar_url ? (
            <Image source={{ uri: review.reviewer_avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.reviewAvatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewName}>{review.reviewer_display_name ?? 'Customer'}</Text>
          <StarRating rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      {review.body ? (
        <Text style={styles.reviewBodyText}>{review.body}</Text>
      ) : (
        <View style={styles.reviewLines}>
          <View style={styles.reviewLine} />
          <View style={[styles.reviewLine, { width: '65%' }]} />
        </View>
      )}
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; link?: boolean }> = ({ icon, label, link }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoLabel, link && styles.infoLabelLink]}>{label}</Text>
  </View>
);

export default function UserBusinessProfile() {
  // Accept businessUid via route param, fallback handled in UI
  const params = useLocalSearchParams<{ businessUid?: string; fromEventId?: string }>();
  const businessUid = params.businessUid;
  const fromEventId = params.fromEventId;

  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);

  useEffect(() => {
    if (!businessUid) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const [biz, evts, revs, followStatus] = await Promise.all([
          getBusinessByUid(businessUid),
          getBusinessEvents(businessUid),
          listReviewsForBusiness(businessUid),
          isFollowing(businessUid),
        ]);
        if (cancelled) return;
        setBusiness(biz);
        setEvents(evts);
        setReviews(revs);
        setFollowing(followStatus);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessUid]);

  const toggleFollow = async () => {
    if (!businessUid || followLoading) return;
    setFollowLoading(true);
    const newState = !following;
    setFollowing(newState); // optimistic
    try {
      if (newState) {
        await followBusiness(businessUid);
      } else {
        await unfollowBusiness(businessUid);
      }
    } catch {
      setFollowing(!newState); // revert on error
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  if (error || !business) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error ?? 'Business not found.'}</Text>
      </SafeAreaView>
    );
  }

  const avgRating = business.avg_rating != null ? Number(business.avg_rating).toFixed(1) : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      {/* ── Yellow Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => fromEventId ? router.push({ pathname: '/(tabs)/view_event', params: { eventId: fromEventId } }) : router.back()}>
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.coverSection}>
          <View style={styles.coverPhoto}>
            {business.logo_url ? (
              <Image source={{ uri: business.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
          </View>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={() => setShowProfileCard(true)} activeOpacity={0.85}>
              <View style={styles.avatar}>
                {business.logo_url ? (
                  <Image source={{ uri: business.logo_url }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarIcon}>🖼</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.businessName}>{business.business_name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.starFilled}>★</Text>
              <Text style={styles.ratingText}> {avgRating} ({reviews.length} reviews)</Text>
            </View>
            <Text style={styles.followersText}>{business.follower_count ?? 0} followers</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={toggleFollow}
              activeOpacity={0.8}
              disabled={followLoading}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={() => Share.share({ message: `Check out ${business.business_name} on the app!` })}>
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          {business.short_description ? (
            <>
              <Text style={styles.cardSectionTitle}>About</Text>
              <Text style={styles.cardBody}>{business.short_description}</Text>
              <View style={styles.divider} />
            </>
          ) : null}

          {business.story ? (
            <>
              <Text style={styles.cardSectionTitle}>Our Story</Text>
              <Text style={styles.cardBody}>{business.story}</Text>
              <View style={styles.divider} />
            </>
          ) : null}

          {business.phone ? <InfoRow icon="📞" label={business.phone} /> : null}
          {business.email ? <InfoRow icon="✉️" label={business.email} link /> : null}
          {business.website ? <InfoRow icon="🌐" label={business.website} link /> : null}
        </View>

        {events.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {events.map(event => (
              <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.8}
                onPress={() => router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: String(event.id) } })}>
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
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

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
      </View>

      {/* ── Profile card modal ── */}
      <Modal visible={showProfileCard} transparent animationType="fade" onRequestClose={() => setShowProfileCard(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProfileCard(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.profileCard} onPress={() => {}}>
            {/* Share button */}
            <TouchableOpacity style={styles.shareIconBtn} onPress={() => Share.share({ message: `Check out ${business.business_name} on the app!` })} activeOpacity={0.7}>
              <Text style={styles.shareIconText}>⎋</Text>
            </TouchableOpacity>

            {/* Large pfp */}
            <View style={styles.cardPfp}>
              {business.logo_url ? (
                <Image source={{ uri: business.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 48 }}>🖼</Text>
              )}
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardBizName}>{business.business_name}</Text>
              {business.short_description ? (
                <Text style={styles.cardBizDesc}>{business.short_description}</Text>
              ) : null}
              <View style={styles.cardStats}>
                <Text style={styles.cardStatText}>👤 {business.follower_count ?? 0}</Text>
                <Text style={styles.cardStatText}>⭐ {avgRating}</Text>
                <TouchableOpacity
                  style={styles.copyLinkBtn}
                  onPress={() => {
                    Alert.alert('Link copied!', `bt-app://business/${businessUid}`);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.copyLinkText}>🔗 Copy Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_BG = '#FFFFFF';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  content: { flex: 1, backgroundColor: '#f5f5f5' },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF1AD', margin: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 18, color: '#111' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111', marginHorizontal: 8 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 16, marginBottom: 14 },
  coverSection: { marginBottom: 0, marginTop: 18 },
  coverPhoto: { height: 150, backgroundColor: CARD_BG, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  coverPhotoIcon: { fontSize: 28, opacity: 0.5 },
  avatarWrapper: { marginTop: -36, marginLeft: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#d0d0d0', borderWidth: 3, borderColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 22, opacity: 0.5 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 36 },
  profileInfo: { paddingTop: 8, marginBottom: 16 },
  businessName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#444', fontWeight: '500' },
  followersText: { fontSize: 13, color: '#444', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: { flex: 1, backgroundColor: '#2E4A7A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  followingBtn: { backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#bbb' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followingBtnText: { color: '#333' },
  shareBtn: { flex: 1, backgroundColor: '#7AAED6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  shareBtnText: { color: '#2E4A7A', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 16, marginBottom: 20 },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  infoIcon: { fontSize: 15, width: 22 },
  infoLabel: { fontSize: 13, color: '#444' },
  infoLabelLink: { color: '#4f7df0', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 12 },
  eventCard: { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 12, marginBottom: 14, gap: 12, alignItems: 'center' },
  eventThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#c8c8c8', overflow: 'hidden' },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontSize: 14, fontWeight: '800', color: '#111' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaIcon: { fontSize: 12 },
  eventMetaText: { fontSize: 12, color: '#666' },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reviewsRating: { flexDirection: 'row', alignItems: 'center' },
  reviewsRatingText: { fontSize: 14, fontWeight: '700', color: '#333' },
  reviewItem: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 15 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 14, color: '#111' },
  reviewDate: { fontSize: 11, color: '#999' },
  reviewBodyText: { fontSize: 13, color: '#444', lineHeight: 18 },
  reviewLines: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#ccc', borderRadius: 4, width: '100%' },
  starsRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ddd' },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  tag: { borderWidth: 1.5, borderColor: '#bbb', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#f0f0f0' },
  tagText: { fontSize: 12, color: '#444' },

  // Profile card modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  profileCard: {
    width: '100%', backgroundColor: '#1a1a1a',
    borderRadius: 22, overflow: 'hidden',
  },
  shareIconBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareIconText: { fontSize: 18, color: '#fff' },
  cardPfp: {
    width: '100%', height: 260,
    backgroundColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { padding: 18 },
  cardBizName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  cardBizDesc: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 19, marginBottom: 14 },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardStatText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  copyLinkBtn: {
    marginLeft: 'auto' as any,
    backgroundColor: '#fff', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  copyLinkText: { fontSize: 13, fontWeight: '700', color: '#111' },
});
