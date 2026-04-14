import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import {
  getFollowedBusinesses,
  getMyProfile,
  getMyReviews,
  type Business,
  type Profile,
  type ReviewRow,
} from '@/services/api';

function FollowedBusinessCard({ biz }: { biz: Business }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.savedCard}>
      <View style={styles.savedImageWrap}>
        {biz.logo_url ? (
          <Image source={{ uri: biz.logo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <Text style={styles.heart}>♥</Text>
      </View>
      <View style={styles.savedBody}>
        <Text style={styles.savedTitle}>{biz.business_name}</Text>
        {biz.short_description ? <Text style={styles.savedMeta}>{biz.short_description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text key={star} style={[styles.starText, { color: star <= rating ? '#f59e0b' : '#ddd' }]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ review, avatarUrl }: { review: ReviewRow; avatarUrl?: string | null }) {
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <View style={styles.reviewAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
        </View>
        <View style={styles.reviewMetaWrap}>
          <Text style={styles.reviewName}>Your review</Text>
          <Stars rating={review.rating} />
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      {review.body ? (
        <Text style={styles.reviewBodyText}>{review.body}</Text>
      ) : (
        <>
          <View style={styles.reviewLineOne} />
          <View style={styles.reviewLineTwo} />
        </>
      )}
    </View>
  );
}

export default function Profile() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followed, setFollowed] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p || cancelled) return;
        setProfile(p);
        const [bizList, revList] = await Promise.all([getFollowedBusinesses(), getMyReviews()]);
        if (cancelled) return;
        setFollowed(bizList);
        setReviews(revList);
      } catch {
        // ignore — show whatever loaded
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch {
      // keep UX simple
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {profile?.display_name ?? 'there'}!</Text>
            <View style={styles.locationRow}>
              <Text style={styles.location}>{profile?.location ?? 'Set location'}</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.editIcon}>✎</Text>
              </TouchableOpacity>
            </View>
          </View>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} resizeMode="cover" />
          ) : (
            <View style={styles.headerAvatar} />
          )}
        </View>

        <Text style={styles.sectionTitle}>Following</Text>
        {followed.length === 0 ? (
          <Text style={styles.emptyText}>You're not following any businesses yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedEventsRow}>
            {followed.map(biz => <FollowedBusinessCard key={biz.uid} biz={biz} />)}
          </ScrollView>
        )}

        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Your Reviews</Text>
        </View>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>You haven't written any reviews yet.</Text>
        ) : (
          reviews.map(r => <ReviewCard key={r.id} review={r} avatarUrl={profile?.avatar_url} />)
        )}

        <TouchableOpacity activeOpacity={0.85} style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#f2f2f2';
const CARD = '#f8f8f8';
const MID = '#d9d9d9';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  location: { fontSize: 20, color: '#222' },
  editIcon: { fontSize: 16, color: '#222', padding: 4 },
  headerAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: MID, marginTop: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },
  savedEventsRow: { gap: 14, paddingBottom: 18, paddingRight: 4 },
  savedCard: { width: 260, backgroundColor: MID, borderRadius: 12, overflow: 'hidden' },
  savedImageWrap: { height: 138, backgroundColor: '#adadad', justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 12, paddingTop: 10 },
  savedImage: { ...StyleSheet.absoluteFillObject, backgroundColor: '#adadad' },
  heart: { fontSize: 24, color: '#111', zIndex: 1 },
  savedBody: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 3 },
  savedTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 2 },
  savedMeta: { fontSize: 13, color: '#1f1f1f' },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  reviewCard: { backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 35, height: 35, borderRadius: 18, backgroundColor: MID, marginRight: 10, overflow: 'hidden' },
  reviewMetaWrap: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 1 },
  reviewDate: { fontSize: 10, color: '#666' },
  starsRow: { flexDirection: 'row', gap: 1 },
  starText: { fontSize: 11 },
  reviewBodyText: { fontSize: 13, color: '#444', lineHeight: 18 },
  reviewLineOne: { height: 10, width: '82%', backgroundColor: '#6b6b6b', marginBottom: 5 },
  reviewLineTwo: { height: 10, width: '98%', backgroundColor: '#6b6b6b', marginBottom: 9 },
  signOutButton: { marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#111', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  signOutButtonText: { color: '#111', fontWeight: '700', fontSize: 14 },
});
