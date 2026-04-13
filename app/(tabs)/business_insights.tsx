import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  trend?: string;
  trendPositive?: boolean;
}> = ({ icon, label, value, sub, subColor, trend, trendPositive = true }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {trend ? (
      <View style={styles.trendRow}>
        <Feather
          name={trendPositive ? 'trending-up' : 'trending-down'}
          size={14}
          color={trendPositive ? '#55be53' : '#ef4444'}
        />
        <Text style={[styles.statTrend, trendPositive ? styles.trendUp : styles.trendDown]}>
          {trend}
        </Text>
      </View>
    ) : null}
    {sub ? <Text style={[styles.statSub, subColor ? { color: subColor } : null]}>{sub}</Text> : null}
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
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      <StarRating rating={review.rating} />
      {review.body ? (
        <Text style={styles.reviewBodyText}>{review.body}</Text>
      ) : (
        <View style={styles.reviewLines}>
          <View style={styles.reviewLine} />
          <View style={[styles.reviewLine, { width: '65%' }]} />
        </View>
      )}
      <TouchableOpacity style={styles.replyBtn} activeOpacity={0.75}>
        <Feather name="corner-up-left" size={12} color="#333" />
        <Text style={styles.replyBtnText}> Reply</Text>
      </TouchableOpacity>
    </View>
  );
};

// Placeholder engagement chart data
const CHART_DATA = [
  { followers: 45, views: 72 },
  { followers: 78, views: 85 },
  { followers: 55, views: 60 },
  { followers: 10, views: 15 },
  { followers: 65, views: 72 },
  { followers: 80, views: 68 },
  { followers: 42, views: 60 },
];
const CHART_LABELS_START = 'Apr 21';
const CHART_LABELS_END = 'Apr 28';
const Y_LABELS = [0, 20, 40, 60, 80, 100];

const EngagementChart: React.FC = () => (
  <View style={styles.chartCard}>
    <View style={styles.chartArea}>
      {/* Y-axis labels */}
      <View style={styles.chartYAxis}>
        {Y_LABELS.slice().reverse().map(v => (
          <Text key={v} style={styles.chartYLabel}>{v}</Text>
        ))}
      </View>
      {/* Bars */}
      <View style={styles.chartBarsWrap}>
        {/* Grid lines */}
        {Y_LABELS.map(v => (
          <View
            key={v}
            style={[styles.chartGridLine, { bottom: `${v}%` }]}
          />
        ))}
        <View style={styles.chartBarsRow}>
          {CHART_DATA.map((d, i) => (
            <View key={i} style={styles.chartBarGroup}>
              <View style={[styles.chartBar, styles.chartBarBlue, { height: `${d.followers}%` }]} />
              <View style={[styles.chartBar, styles.chartBarGold, { height: `${d.views}%` }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
    {/* X-axis labels */}
    <View style={styles.chartXAxis}>
      <Text style={styles.chartXLabel}>{CHART_LABELS_START}</Text>
      <Text style={styles.chartXLabel}>{CHART_LABELS_END}</Text>
    </View>
    {/* Legend */}
    <View style={styles.chartLegend}>
      <View style={styles.chartLegendItem}>
        <View style={[styles.chartLegendDot, { backgroundColor: '#5b7ec2' }]} />
        <Text style={styles.chartLegendText}>New Followers</Text>
      </View>
      <View style={styles.chartLegendItem}>
        <View style={[styles.chartLegendDot, { backgroundColor: '#e8b84b' }]} />
        <Text style={styles.chartLegendText}>Views</Text>
      </View>
    </View>
  </View>
);

// ─── Page ───────────────────────────────────────────────────────────────────
type Period = '7d' | '14d' | '30d' | '90d';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export default function BusinessInsights() {
  const [period, setPeriod] = useState<Period>('7d');
  const [periodOpen, setPeriodOpen] = useState(false);
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
            .slice(0, 4);
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

  // Compute max mentions for progress bar scaling
  const maxMentions = topProducts.length > 0 ? topProducts[0].count : 1;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5d990" />

      {/* ── Header (golden gradient) ── */}
      <LinearGradient
        colors={['#f5d990', '#f0c060']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Insights</Text>
          </View>
          <TouchableOpacity
            style={styles.periodPill}
            onPress={() => setPeriodOpen(o => !o)}
            activeOpacity={0.75}
          >
            <Text style={styles.periodPillText}>
              {PERIOD_OPTIONS.find(o => o.value === period)?.label}
            </Text>
            <Feather name="chevron-down" size={14} color="#333" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Period dropdown — anchored below the header, overlays scroll content */}
      {periodOpen && (
        <View style={styles.periodDropdownWrapper}>
          <TouchableOpacity
            style={styles.periodOverlayBg}
            activeOpacity={1}
            onPress={() => setPeriodOpen(false)}
          />
          <View style={styles.periodDropdown}>
            {PERIOD_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.periodOption, opt.value === period && styles.periodOptionSelected]}
                onPress={() => { setPeriod(opt.value); setPeriodOpen(false); }}
              >
                <Text style={[styles.periodOptionText, opt.value === period && styles.periodOptionTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Performance ── */}
        <Text style={styles.sectionTitle}>Profile Performance</Text>
        <View style={styles.statGrid}>
          <StatCard icon="eye" label="Profile Views" value="—" trend="+23%" />
          <StatCard icon="users" label="Followers" value={String(followerCount)} trend="+5" />
          <StatCard
            icon="heart"
            label="Engagement"
            value="—"
            sub="Profile Saves"
            subColor="#4169e1"
          />
          <StatCard
            icon="star"
            label="Rating"
            value={avgRatingDisplay}
            sub={`${reviews.length} reviews`}
          />
        </View>

        {/* ── Event Performance ── */}
        <Text style={styles.sectionTitle}>Event Performance</Text>
        <View style={styles.statGrid}>
          <StatCard
            icon="calendar"
            label="Total Events"
            value={String(totalEvents)}
            sub={`${upcomingEvents} upcoming`}
          />
          <StatCard icon="users" label="Total RSVPs" value="—" trend="+34%" />
          <StatCard icon="eye" label="Event Views" value="—" trend="+28%" />
          <StatCard icon="bar-chart-2" label="Average Attendance" value="—" sub="of RSVPs show up" />
        </View>

        {/* ── Engagement Chart ── */}
        <Text style={styles.sectionTitle}>Engagement</Text>
        <EngagementChart />

        {/* ── Top Items by Mentions ── */}
        <Text style={styles.sectionTitle}>Top Items by Mentions</Text>
        <View style={styles.mentionsCard}>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No product mentions yet.</Text>
          ) : (
            topProducts.map((p, idx) => {
              const pct = Math.round((p.count / maxMentions) * 100);
              return (
                <View key={`${p.name}-${idx}`} style={styles.mentionRow}>
                  <View style={styles.mentionTextRow}>
                    <Text style={styles.mentionName}>{p.name}</Text>
                    <Text style={styles.mentionPct}>{pct}% mentions</Text>
                  </View>
                  <View style={styles.mentionBarTrack}>
                    <View style={[styles.mentionBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Recent Reviews ── */}
        <Text style={styles.sectionTitle}>Recent Reviews</Text>

        <View style={styles.ratingSummaryCard}>
          <View style={styles.ratingSummaryLeft}>
            <Text style={styles.ratingSummaryValue}>{avgRatingDisplay}</Text>
            <StarRating rating={Math.round(avgRatingNum)} size={14} />
            <Text style={styles.ratingSummaryCount}>{reviews.length} reviews</Text>
          </View>
          <View style={styles.ratingBreakdown}>
            {ratingBreakdown.map(r => (
              <RatingBar key={r.stars} stars={r.stars} percent={r.percent} />
            ))}
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
const RADIUS = 10;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // ── Header ──
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#000' },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodPillText: { fontSize: 13, fontWeight: '600', color: '#333' },
  periodDropdownWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  periodOverlayBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  periodDropdown: {
    position: 'absolute',
    top: 110,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    paddingVertical: 4,
    minWidth: 130,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  periodOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  periodOptionSelected: {
    backgroundColor: '#f5f5f5',
  },
  periodOptionText: { fontSize: 14, color: '#333' },
  periodOptionTextSelected: { fontWeight: '700', color: '#111' },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
    marginTop: 4,
  },

  // ── Stat Cards ──
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: { fontSize: 14, fontWeight: '400', color: '#000', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#000' },
  statSub: { fontSize: 13, color: '#696969', marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statTrend: { fontSize: 13, fontWeight: '600' },
  trendUp: { color: '#55be53' },
  trendDown: { color: '#ef4444' },

  // ── Engagement Chart ──
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chartArea: {
    flexDirection: 'row',
    height: 160,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: 8,
    paddingVertical: 2,
  },
  chartYLabel: { fontSize: 10, color: '#999' },
  chartBarsWrap: {
    flex: 1,
    position: 'relative',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#eee',
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  chartBar: {
    width: 14,
    borderRadius: 3,
  },
  chartBarBlue: { backgroundColor: '#5b7ec2' },
  chartBarGold: { backgroundColor: '#e8b84b' },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingLeft: 30,
  },
  chartXLabel: { fontSize: 11, color: '#999' },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  chartLegendText: { fontSize: 11, color: '#666' },

  // ── Top Items ──
  mentionsCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mentionRow: {
    marginBottom: 14,
  },
  mentionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mentionName: { fontSize: 14, fontWeight: '500', color: '#111' },
  mentionPct: { fontSize: 13, color: '#666' },
  mentionBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8e8e8',
    overflow: 'hidden',
  },
  mentionBarFill: {
    height: '100%',
    backgroundColor: '#4169e1',
    borderRadius: 3,
  },

  // ── Rating Summary ──
  ratingSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 14,
    marginBottom: 14,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingSummaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  ratingBreakdown: { flex: 1, gap: 5 },
  ratingSummaryValue: { fontSize: 28, fontWeight: '900', color: '#111' },
  ratingSummaryCount: { fontSize: 11, color: '#666', marginTop: 4 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarLabel: { fontSize: 12, fontWeight: '700', color: '#333', width: 10 },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e8e8e8',
    overflow: 'hidden',
  },
  ratingBarFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 4 },
  ratingBarPercent: { fontSize: 11, fontWeight: '600', color: '#666', width: 32, textAlign: 'right' },

  // ── Reviews ──
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewAvatarText: { fontWeight: '700', color: '#555', fontSize: 16 },
  reviewMeta: { flex: 1 },
  reviewName: { fontWeight: '700', fontSize: 15, color: '#111' },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewBodyText: { fontSize: 13, color: '#444', lineHeight: 19, marginTop: 6, marginBottom: 8 },
  reviewLines: { gap: 6, marginBottom: 10 },
  reviewLine: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, width: '100%' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4, marginTop: 4 },
  replyBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },

  starsRow: { flexDirection: 'row', gap: 1 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ddd' },

  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },
});
