import { imageSource } from "@/utils/imageSource";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { createMyReview, getBusinessByUid, getEventById, type Business, type EventRow } from '@/services/api';

type RatingCategory = 'Overall' | 'Quality' | 'Value' | 'Service';
interface Ratings { Overall: number; Quality: number; Value: number; Service: number }

const StarSelector: React.FC<{ label: RatingCategory; value: number; onChange: (val: number) => void }> = ({ label, value, onChange }) => (
  <View style={styles.starSelectorRow}>
    <Text style={styles.starSelectorLabel}>{label}</Text>
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={[styles.starIcon, i <= value ? styles.starFilled : styles.starEmpty]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.starValue}>{value > 0 ? `${value}.0` : '—'}</Text>
  </View>
);

const RATING_CATEGORIES: RatingCategory[] = ['Overall', 'Quality', 'Value', 'Service'];

const QUICK_TAGS = [
  'Great quality', 'Good value', 'Friendly staff',
  'Would return', 'Unique finds', 'Fast service',
  'Great atmosphere', 'Hidden gem',
];

export default function AddReview() {
  const params = useLocalSearchParams<{ businessUid?: string; eventId?: string }>();
  const businessUid = params.businessUid;
  const eventId = params.eventId ? Number(params.eventId) : null;

  const [business, setBusiness] = useState<Business | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [ratings, setRatings] = useState<Ratings>({ Overall: 0, Quality: 0, Value: 0, Service: 0 });
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (businessUid) getBusinessByUid(businessUid).then(setBusiness).catch(() => {});
    if (eventId) getEventById(eventId).then(setEvent).catch(() => {});
  }, [businessUid, eventId]);

  const setRating = (category: RatingCategory, val: number) => {
    setRatings(prev => ({ ...prev, [category]: val }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const canSubmit = ratings.Overall > 0 && reviewText.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!businessUid) {
      Alert.alert('Error', 'No business selected for this review.');
      return;
    }
    setSubmitting(true);
    try {
      const tagLine = selectedTags.length > 0 ? `\n\nTags: ${selectedTags.join(', ')}` : '';
      await createMyReview({
        business_uid: businessUid,
        event_id: eventId,
        rating: ratings.Overall,
        body: reviewText.trim() + tagLine,
      });
      Alert.alert('Review submitted!', 'Thank you for your feedback.', [
        { text: 'OK', onPress: () => eventId
            ? router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: String(eventId) } })
            : router.navigate('/(tabs)/explore') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => eventId
            ? router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: String(eventId) } })
            : router.navigate('/(tabs)/explore')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Write a Review</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.businessCard}>
          <View style={styles.businessAvatar}>
            {business?.logo_url
              ? <Image source={imageSource(business.logo_url)} style={styles.avatarImage} resizeMode="cover" />
              : <Text style={styles.businessAvatarIcon}>🖼</Text>
            }
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business?.business_name ?? 'Loading…'}</Text>
            {event ? <Text style={styles.businessSub}>{event.event_name}</Text> : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate your experience</Text>
          {RATING_CATEGORIES.map(cat => (
            <StarSelector key={cat} label={cat} value={ratings[cat]} onChange={val => setRating(cat, val)} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience — what did you love, what stood out, would you recommend it?"
            placeholderTextColor="#aaa"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{reviewText.length}/500</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick tags</Text>
          <Text style={styles.cardSubtitle}>Select all that apply</Text>
          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Would you recommend this business?</Text>
          <View style={styles.recommendRow}>
            <TouchableOpacity style={[styles.recommendBtn, recommended === true && styles.recommendBtnYes]} onPress={() => setRecommended(true)} activeOpacity={0.8}>
              <Text style={styles.recommendEmoji}>👍</Text>
              <Text style={[styles.recommendText, recommended === true && styles.recommendTextSelected]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.recommendBtn, recommended === false && styles.recommendBtnNo]} onPress={() => setRecommended(false)} activeOpacity={0.8}>
              <Text style={styles.recommendEmoji}>👎</Text>
              <Text style={[styles.recommendText, recommended === false && styles.recommendTextSelected]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={canSubmit ? 0.85 : 1}
          disabled={!canSubmit}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
        </TouchableOpacity>

        {!canSubmit && !submitting && (
          <Text style={styles.submitHint}>
            {ratings.Overall === 0 ? 'Please add an overall rating to continue' : 'Please write a review to continue'}
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  content: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF1AD' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  businessCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14 },
  businessAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#d0d0d0', alignItems: 'center', justifyContent: 'center' },
  businessAvatarIcon: { fontSize: 22, opacity: 0.5 },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 3 },
  businessSub: { fontSize: 12, color: '#777' },
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#888', marginBottom: 12 },
  starSelectorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  starSelectorLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  starsRow: { flexDirection: 'row', gap: 4 },
  starIcon: { fontSize: 28 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#d0d0d0' },
  starValue: { width: 30, textAlign: 'right', fontSize: 13, fontWeight: '700', color: '#555' },
  reviewInput: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333', minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 6 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: { borderWidth: 1.5, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff' },
  tagSelected: { backgroundColor: '#2E4A7A', borderColor: '#2E4A7A' },
  tagText: { fontSize: 12, color: '#555', fontWeight: '500' },
  tagTextSelected: { color: '#fff', fontWeight: '700' },
  recommendRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  recommendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 10, paddingVertical: 12, backgroundColor: '#fff' },
  recommendBtnYes: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  recommendBtnNo: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  recommendEmoji: { fontSize: 18 },
  recommendText: { fontSize: 14, fontWeight: '700', color: '#555' },
  recommendTextSelected: { color: '#111' },
  submitBtn: { backgroundColor: '#2E4A7A', borderRadius: RADIUS, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  submitBtnDisabled: { backgroundColor: '#bbb' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  submitHint: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 4 },
});
