import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type RatingCategory = 'Overall' | 'Quality' | 'Value' | 'Service';

interface Ratings {
  Overall: number;
  Quality: number;
  Value: number;
  Service: number;
}

// ─── Star Selector ────────────────────────────────────────────────────────────
interface StarSelectorProps {
  label: RatingCategory;
  value: number;
  onChange: (val: number) => void;
}

const StarSelector: React.FC<StarSelectorProps> = ({ label, value, onChange }) => (
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

// ─── Photo Placeholder ────────────────────────────────────────────────────────
const PhotoPlaceholder: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.photoPlaceholder} onPress={onPress} activeOpacity={0.75}>
    <Text style={styles.photoIcon}>📷</Text>
    <Text style={styles.photoLabel}>Add Photo</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RATING_CATEGORIES: RatingCategory[] = ['Overall', 'Quality', 'Value', 'Service'];

const QUICK_TAGS = [
  'Great quality', 'Good value', 'Friendly staff',
  'Would return', 'Unique finds', 'Fast service',
  'Great atmosphere', 'Hidden gem',
];

export default function AddReview() {
  const [ratings, setRatings] = useState<Ratings>({
    Overall: 0,
    Quality: 0,
    Value: 0,
    Service: 0,
  });
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<boolean | null>(null);

  const setRating = (category: RatingCategory, val: number) => {
    setRatings(prev => ({ ...prev, [category]: val }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addPhoto = () => {
    // Placeholder — wire up image picker here
    if (photos.length < 4) setPhotos(prev => [...prev, `photo_${Date.now()}`]);
  };

  const handleSubmit = () => {
    console.log({ ratings, reviewText, selectedTags, photos, recommended });
  };

  const allRated = RATING_CATEGORIES.every(c => ratings[c] > 0);
  const canSubmit = allRated && reviewText.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Write a Review</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Business Info ── */}
        <View style={styles.businessCard}>
          <View style={styles.businessAvatar}>
            <Text style={styles.businessAvatarIcon}>🖼</Text>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>Business Name</Text>
            <Text style={styles.businessSub}>📍 Location</Text>
          </View>
        </View>

        {/* ── Star Ratings ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate your experience</Text>
          {RATING_CATEGORIES.map(cat => (
            <StarSelector
              key={cat}
              label={cat}
              value={ratings[cat]}
              onChange={val => setRating(cat, val)}
            />
          ))}
        </View>

        {/* ── Written Review ── */}
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

        {/* ── Quick Tags ── */}
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
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Photos ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add photos</Text>
          <Text style={styles.cardSubtitle}>Optional · up to 4 photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
            {photos.map((p, i) => (
              <View key={p} style={styles.photoThumb}>
                <Text style={styles.photoThumbIcon}>🖼</Text>
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.photoRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && <PhotoPlaceholder onPress={addPhoto} />}
          </ScrollView>
        </View>

        {/* ── Would Recommend ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Would you recommend this business?</Text>
          <View style={styles.recommendRow}>
            <TouchableOpacity
              style={[styles.recommendBtn, recommended === true && styles.recommendBtnYes]}
              onPress={() => setRecommended(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.recommendEmoji}>👍</Text>
              <Text style={[styles.recommendText, recommended === true && styles.recommendTextSelected]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recommendBtn, recommended === false && styles.recommendBtnNo]}
              onPress={() => setRecommended(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.recommendEmoji}>👎</Text>
              <Text style={[styles.recommendText, recommended === false && styles.recommendTextSelected]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={canSubmit ? 0.85 : 1}
          disabled={!canSubmit}
        >
          <Text style={styles.submitBtnText}>Submit Review</Text>
        </TouchableOpacity>

        {!canSubmit && (
          <Text style={styles.submitHint}>
            {!allRated ? 'Please rate all categories to continue' : 'Please write a review to continue'}
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#333' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#111' },

  // Business Card
  businessCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14,
  },
  businessAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#d0d0d0',
    alignItems: 'center', justifyContent: 'center',
  },
  businessAvatarIcon: { fontSize: 22, opacity: 0.5 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 3 },
  businessSub: { fontSize: 12, color: '#777' },

  // Card
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#888', marginBottom: 12 },

  // Star Selector
  starSelectorRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  starSelectorLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  starsRow: { flexDirection: 'row', gap: 4 },
  starIcon: { fontSize: 28 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#d0d0d0' },
  starValue: { width: 30, textAlign: 'right', fontSize: 13, fontWeight: '700', color: '#555' },

  // Review Input
  reviewInput: {
    backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#d0d0d0',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333',
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 6 },

  // Quick Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: {
    borderWidth: 1.5, borderColor: '#ccc', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff',
  },
  tagSelected: { backgroundColor: '#222', borderColor: '#222' },
  tagText: { fontSize: 12, color: '#555', fontWeight: '500' },
  tagTextSelected: { color: '#fff', fontWeight: '700' },

  // Photos
  photosRow: { marginTop: 4 },
  photoThumb: {
    width: 80, height: 80, borderRadius: 10, backgroundColor: '#d0d0d0',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  photoThumbIcon: { fontSize: 24, opacity: 0.5 },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  photoPlaceholder: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 2, borderColor: '#ccc', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, gap: 4,
  },
  photoIcon: { fontSize: 20, opacity: 0.5 },
  photoLabel: { fontSize: 10, color: '#999', fontWeight: '600' },

  // Recommend
  recommendRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  recommendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 10,
    paddingVertical: 12, backgroundColor: '#fff',
  },
  recommendBtnYes: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  recommendBtnNo: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  recommendEmoji: { fontSize: 18 },
  recommendText: { fontSize: 14, fontWeight: '700', color: '#555' },
  recommendTextSelected: { color: '#111' },

  // Submit
  submitBtn: {
    backgroundColor: '#222', borderRadius: RADIUS,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
  },
  submitBtnDisabled: { backgroundColor: '#bbb' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  submitHint: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 4 },
});