import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type SavedEvent = {
  id: string;
  title: string;
  business: string;
  date: string;
  address: string;
};

type Review = {
  id: string;
  name: string;
  date: string;
};

const SAVED_EVENTS: SavedEvent[] = [
  {
    id: '1',
    title: 'Matcha Pop-up',
    business: 'Business Name',
    date: 'Thursday, 4 PM',
    address: 'Address',
  },
  {
    id: '2',
    title: 'Matcha Pop-up',
    business: 'Business Name',
    date: 'Thursday, 4 PM',
    address: 'Address',
  },
];

const REVIEWS: Review[] = [
  { id: '1', name: 'Name', date: 'mm-dd-yyyy' },
  { id: '2', name: 'Name', date: 'mm-dd-yyyy' },
  { id: '3', name: 'Name', date: 'mm-dd-yyyy' },
];

function SavedEventCard({ event }: { event: SavedEvent }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.savedCard}>
      <View style={styles.savedImageWrap}>
        <View style={styles.savedImage} />
        <Text style={styles.heart}>♥</Text>
      </View>

      <View style={styles.savedBody}>
        <Text style={styles.savedTitle}>{event.title}</Text>
        <Text style={styles.savedMeta}>{event.business}</Text>
        <Text style={styles.savedMeta}>{event.date}</Text>
        <Text style={styles.savedMeta}>{event.address}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Stars() {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text key={star} style={styles.starText}>
          ★
        </Text>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <View style={styles.reviewAvatar} />

        <View style={styles.reviewMetaWrap}>
          <Text style={styles.reviewName}>{review.name}</Text>
          <Stars />
        </View>

        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>

      <View style={styles.reviewLineOne} />
      <View style={styles.reviewLineTwo} />

      <TouchableOpacity activeOpacity={0.8} style={styles.replyButton}>
        <Text style={styles.replyText}>↶ Reply</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Profile() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, Name!</Text>

            <View style={styles.locationRow}>
              <Text style={styles.location}>Austin, Texas</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.editIcon}>✎</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerAvatar} />
        </View>

        <Text style={styles.sectionTitle}>Saved Events</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.savedEventsRow}>
          {SAVED_EVENTS.map(event => (
            <SavedEventCard key={event.id} event={event} />
          ))}
        </ScrollView>

        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Your Reviews</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterDot} />
            <View style={styles.filterDot} />
            <View style={styles.filterDot} />
          </View>
        </View>

        {REVIEWS.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#f2f2f2';
const CARD = '#f8f8f8';
const MID = '#d9d9d9';
const DARK = '#6b6b6b';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  location: {
    fontSize: 20,
    color: '#222',
  },
  editIcon: {
    fontSize: 16,
    color: '#222',
    padding: 4,
  },
  headerAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: MID,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },

  savedEventsRow: {
    gap: 14,
    paddingBottom: 18,
    paddingRight: 4,
  },
  savedCard: {
    width: 260,
    backgroundColor: MID,
    borderRadius: 12,
    overflow: 'hidden',
  },
  savedImageWrap: {
    height: 138,
    backgroundColor: '#adadad',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 10,
  },
  savedImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#adadad',
  },
  heart: {
    fontSize: 24,
    color: '#111',
    zIndex: 1,
  },
  savedBody: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  savedTitle: {
    fontSize: 30,
    fontWeight: '500',
    color: '#111',
    marginBottom: 2,
  },
  savedMeta: {
    fontSize: 20,
    color: '#1f1f1f',
  },

  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: MID,
  },

  reviewCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: MID,
    marginRight: 10,
  },
  reviewMetaWrap: {
    flex: 1,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 1,
  },
  reviewDate: {
    fontSize: 10,
    color: '#666',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starText: {
    fontSize: 11,
    color: '#111',
  },
  reviewLineOne: {
    height: 10,
    width: '82%',
    backgroundColor: DARK,
    marginBottom: 5,
  },
  reviewLineTwo: {
    height: 10,
    width: '98%',
    backgroundColor: DARK,
    marginBottom: 9,
  },
  replyButton: {
    alignSelf: 'flex-start',
  },
  replyText: {
    fontSize: 10,
    color: '#444',
    fontWeight: '500',
  },
});
