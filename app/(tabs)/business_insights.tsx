import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  getInventory,
  getMyProfile,
  listMyEvents,
  listReviewsForBusiness,
  type Business,
  type EventRow,
  type ReviewRow,
} from '@/services/api';

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

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendPositive?: boolean;
}> = ({ icon, label, value, sub, trend, trendPositive = true }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    {trend ? (
      <Text style={[styles.statTrend, trendPositive ? styles.trendUp : styles.trendDown]}>
        {trendPositive ? '▲' : '▼'} {trend}
      </Text>
    ) : null}
  </View>
);

const RatingBar: React.FC<{ stars: number; percent: number }> = ({ stars, percent }) => (
  <View style={styles.ratingBarRow}>
    <Text style={styles.ratingBarLabel}>{stars}</Text>
    <View style={styles.ratingBarTrack}>
      <View style={[styles.ratingBarFill, { width: `${percent}%` }]} />
    </View>
    <Text style={styles.ratingBarPercent}>{percent}%</Text>
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

// ─── Page ───────────────────────────────────────────────────────────────────
type Period = '7d' | '30d';

export default function BusinessInsights() {
  const [period, setPeriod] = useState<Period>('7d');
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (!profile || cancelled) return;

        const [biz, evts, revs] = await Promise.all([
          getBusinessByUid(profile.uid),
          listMyEvents(100),
          listReviewsForBusiness(profile.uid),
        ]);
        if (cancelled) return;
        setBusiness(biz);
        setEvents(evts);
        setReviews(revs);

        // Aggregate top product mentions from inventory across events
        try {
          const inventories = await Promise.all(evts.map(e => getInventory(e.id).catch(() => [])));
          const counts: Record<string, number> = {};
          for (const items of inventories) {
            for (const item of items) {
              counts[item.product_name] = (counts[item.product_name] ?? 0) + 1;
            }
          }
          const top = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          if (!cancelled) setTopProducts(top);
        } catch {
          // silently ignore
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const ratingBreakdown = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return [5, 4, 3, 2, 1].map(stars => ({ stars, percent: 0 }));
    return [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => r.rating === stars).length;
      return { stars, percent: Math.round((count / total) * 100) };
    });
  }, [reviews]);

  const avgRatingNum =
    business?.avg_rating != null ? Number(business.avg_rating) : 0;
  const avgRatingDisplay = business?.avg_rating != null ? avgRatingNum.toFixed(1) : '—';
  const followerCount = business?.follower_count ?? 0;
  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    e => e.status !== 'closed' && e.status !== 'cancelled',
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              activeOpacity={0.75}
              onPress={() => router.back()}
            >
              <Text style={styles.headerBackIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Insights</Text>
          </View>
          <View style={styles.periodTabs}>
            <TouchableOpacity
              style={[styles.periodTab, period === '7d' && styles.periodTabActive]}
              onPress={() => setPeriod('7d')}
              activeOpacity={0.75}
            >
              <Text style={[styles.periodTabText, period === '7d' && styles.periodTabTextActive]}>
                7 d
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodTab, period === '30d' && styles.periodTabActive]}
              onPress={() => setPeriod('30d')}
              activeOpacity={0.75}
            >
              <Text style={[styles.periodTabText, period === '30d' && styles.periodTabTextActive]}>
                30 d
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Profile Performance ── */}
        <Text style={styles.sectionTitle}>Profile Performance</Text>
        <View style={styles.statGrid}>
          <StatCard icon="👁" label="Profile Views" value="—" trend="—%" />
          <StatCard icon="👥" label="Followers" value={String(followerCount)} trend="—" />
          <StatCard
            icon="⭐"
            label="Rating"
            value={`${avgRatingDisplay}/5`}
            sub={`${reviews.length} reviews`}
          />
          <StatCard icon="🔖" label="Saves" value="—" trend="—%" />
        </View>

        {/* ── Event Performance ── */}
        <Text style={styles.sectionTitle}>Event Performance</Text>
        <View style={styles.statGrid}>
          <StatCard
            icon="📅"
            label="Total Events"
            value={String(totalEvents)}
            sub={`${upcomingEvents} upcoming`}
          />
          <StatCard icon="✋" label="Total RSVPs" value="—" trend="—%" />
          <StatCard icon="👁" label="Event Views" value="—" trend="—%" />
          <StatCard icon="📊" label="Avg Attendance" value="—" sub="of RSVPs show up" />
        </View>

        {/* ── Top Items by Mentions ── */}
        <Text style={styles.sectionTitle}>Top Items by Mentions</Text>
        <View style={styles.card}>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No product mentions yet.</Text>
          ) : (
            topProducts.map((p, idx) => (
              <View
                key={`${p.name}-${idx}`}
                style={[styles.productRow, idx < topProducts.length - 1 && styles.productRowBorder]}
              >
                <Text style={styles.productRank}>{idx + 1}</Text>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.productCount}>{p.count} mentions</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Recent Reviews ── */}
        <Text style={styles.sectionTitle}>Recent Reviews</Text>

        <View style={styles.ratingSummaryCard}>
          <View style={styles.ratingBreakdown}>
            {ratingBreakdown.map(r => (
              <RatingBar key={r.stars} stars={r.stars} percent={r.percent} />
            ))}
          </View>
          <View style={styles.ratingSummaryRight}>
            <Text style={styles.ratingSummaryValue}>{avgRatingDisplay}</Text>
            <StarRating rating={Math.round(avgRatingNum)} size={14} />
            <Text style={styles.ratingSummaryCount}>{reviews.length} reviews</Text>
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

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
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
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#111' },

  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  periodTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  periodTabText: { fontSize: 13, fontWeight: '700', color: '#888' },
  periodTabTextActive: { color: '#111' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 12 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '47.5%',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 14,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statIcon: { fontSize: 14 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 2 },
  statSub: { fontSize: 11, color: '#777', marginTop: 2 },
  statTrend: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  trendUp: { color: '#22c55e' },
  trendDown: { color: '#ef4444' },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 14,
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  productRowBorder: { borderBottomWidth: 1, borderBottomColor: '#d5d5d5' },
  productRank: {
    width: 20,
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
  },
  productName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111' },
  productCount: { fontSize: 12, fontWeight: '600', color: '#666' },

  ratingSummaryCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 14,
    marginBottom: 14,
    gap: 16,
  },
  ratingBreakdown: { flex: 1, gap: 6 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarLabel: { fontSize: 12, fontWeight: '700', color: '#333', width: 10 },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d5d5d5',
    overflow: 'hidden',
  },
  ratingBarFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 4 },
  ratingBarPercent: { fontSize: 11, fontWeight: '600', color: '#666', width: 32, textAlign: 'right' },
  ratingSummaryRight: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  ratingSummaryValue: { fontSize: 28, fontWeight: '900', color: '#111' },
  ratingSummaryCount: { fontSize: 11, color: '#666', marginTop: 4 },

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
