import { imageSource } from "@/utils/imageSource";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  followBusiness,
  getBusinessByUid,
  getBusinessTags,
  isFollowing,
  listReviewsForBusiness,
  unfollowBusiness,
  type Business,
  type VibeTag,
} from '@/services/api';

function generateTimeSlots(start: string, end: string): string[] {
  const parse = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:00 ${period}`;
  };
  const startMins = parse(start);
  const endMins = parse(end);
  if (!start || !end || endMins <= startMins) return [];
  const slots: string[] = [];
  for (let m = startMins; m < endMins; m += 60) slots.push(fmt(m));
  return slots;
}

// ─── Fake menu data ───────────────────────────────────────────────────────────
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Iced Matcha Latte', description: 'Ceremonial grade matcha with oat milk over ice', price: 6.50, available: true },
  { id: '2', name: 'Hot Matcha Latte', description: 'Warm ceremonial matcha with steamed oat milk', price: 6.00, available: true },
  { id: '3', name: 'Matcha Frappe', description: 'Blended matcha with milk and ice', price: 7.00, available: true },
  { id: '4', name: 'Hojicha Latte', description: 'Roasted green tea latte, hot or iced', price: 6.00, available: true },
  { id: '5', name: 'Mochi Donut', description: 'Chewy matcha-glazed mochi donut', price: 4.00, available: true },
  { id: '6', name: 'Matcha Cookie', description: 'Soft-baked white chocolate matcha cookie', price: 3.50, available: true },
  { id: '7', name: 'Matcha Cheesecake Slice', description: 'No-bake matcha cheesecake on graham crust', price: 7.00, available: false },
];

export default function CustomerPreorder() {
  const { eventId, eventName, businessUid, eventLocation, startTime, endTime } = useLocalSearchParams<{
    eventId?: string;
    eventName?: string;
    businessUid?: string;
    eventLocation?: string;
    startTime?: string;
    endTime?: string;
  }>();

  const [business, setBusiness] = useState<Business | null>(null);
  const [tags, setTags] = useState<VibeTag[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const timeSlots = generateTimeSlots(startTime ?? '', endTime ?? '');

  useEffect(() => {
    if (!businessUid) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [biz, revs, followStatus, bizTags] = await Promise.all([
          getBusinessByUid(businessUid),
          listReviewsForBusiness(businessUid, 1),
          isFollowing(businessUid),
          getBusinessTags(businessUid),
        ]);
        if (cancelled) return;
        setBusiness(biz);
        setReviewCount(revs.length);
        setFollowing(followStatus);
        setTags(bizTags);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessUid]);

  const toggleFollow = async () => {
    if (!businessUid || followLoading) return;
    setFollowLoading(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followBusiness(businessUid);
      else await unfollowBusiness(businessUid);
    } catch {
      setFollowing(!next);
    } finally {
      setFollowLoading(false);
    }
  };

  const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const removeFromCart = (id: string) => setCart(prev => {
    const next = { ...prev };
    if ((next[id] ?? 0) <= 1) delete next[id];
    else next[id] -= 1;
    return next;
  });

  const cartItems = MENU_ITEMS.filter(i => cart[i.id]).map(i => ({ item: i, qty: cart[i.id] }));
  const total = cartItems.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);

  const placeOrder = () => {
    if (!cartItems.length) return;
    Alert.alert(
      'Order Placed!',
      `Your pre-order of ${totalQty} item${totalQty !== 1 ? 's' : ''} ($${total.toFixed(2)}) has been submitted. You'll be notified when it's ready.`,
      [{ text: 'OK', onPress: () => router.navigate({ pathname: '/(tabs)/view_event', params: { eventId: eventId ?? '' } }) }],
    );
  };

  const goBack = () => {
    if (eventId) router.navigate({ pathname: '/(tabs)/view_event', params: { eventId } });
    else router.back();
  };

  const avgRating = business?.avg_rating != null ? Number(business.avg_rating).toFixed(1) : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      {/* ── Yellow Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBtn} onPress={goBack}>
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>
        {/* <Text style={styles.navTitle} numberOfLines={1}>
          {business?.business_name ?? 'Pre-Order'}
        </Text> */}
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Cover + Avatar ── */}
          <View style={styles.coverSection}>
            <View style={styles.coverPhoto}>
              {(business?.background_url || business?.logo_url) ? (
                <Image source={imageSource(business?.background_url || business?.logo_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
              ) : null}
            </View>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                {business?.logo_url ? (
                  <Image source={imageSource(business.logo_url)} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarIcon}>🖼</Text>
                )}
              </View>
            </View>
          </View>

          {/* ── Business info ── */}
          <View style={styles.profileInfo}>
            <Text style={styles.businessName}>{business?.business_name ?? 'Business'}</Text>
            {eventName ? <Text style={styles.eventName}>{eventName}</Text> : null}

            <View style={styles.statsRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.starFilled}>★</Text>
                <Text style={styles.ratingText}> {avgRating} ({reviewCount} reviews)</Text>
              </View>
              <Text style={styles.followersText}>{business?.follower_count ?? 0} followers</Text>
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map(tag => (
                  <View key={tag.id} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            )}

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
              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={() => Share.share({ message: `Check out ${business?.business_name ?? 'this business'} on the app!` })}>
                <Text style={styles.shareBtnText}>Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Pickup ── */}
          {eventLocation ? (
            <View style={styles.pickupSection}>
              <Text style={styles.pickupTitle}>Pickup</Text>
              <View style={styles.pickupCard}>
                <Text style={styles.pickupIcon}>📍</Text>
                <Text style={styles.pickupAddress}>{eventLocation}</Text>
              </View>
              {timeSlots.length > 0 && (
                <>
                  <Text style={styles.pickupTimesLabel}>Select a pickup time</Text>
                  <View style={styles.timeSlotsRow}>
                    {timeSlots.map(slot => (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.timeSlotBtn, selectedTime === slot && styles.timeSlotBtnActive]}
                        onPress={() => setSelectedTime(slot)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextActive]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : null}

          {/* ── Menu items ── */}
          <View style={styles.menuSection}>
            <View style={styles.menuHeaderRow}>
              <Text style={styles.menuTitle}>In Stock</Text>
              {totalQty > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalQty} in cart</Text>
                </View>
              ) : null}
            </View>

            {MENU_ITEMS.map(item => {
              const qty = cart[item.id] ?? 0;
              return (
                <View key={item.id} style={[styles.card, !item.available && styles.cardUnavailable]}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.itemName, !item.available && styles.itemNameUnavailable]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    {!item.available && <Text style={styles.soldOutLabel}>Sold Out</Text>}
                  </View>
                  {item.available ? (
                    qty === 0 ? (
                      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item.id)}>
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item.id)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
      </View>

      {/* ── Sticky order bar ── */}
      {cartItems.length > 0 ? (
        <View style={styles.orderBar}>
          <View style={styles.orderBarInfo}>
            <Text style={styles.orderBarQty}>{totalQty} item{totalQty !== 1 ? 's' : ''}</Text>
            <Text style={styles.orderBarTotal}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={placeOrder} activeOpacity={0.85}>
            <Text style={styles.placeOrderBtnText}>Place Pre-Order</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const CARD_BG = '#ffffff';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  content: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF1AD', margin: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 18, color: '#111' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111', marginHorizontal: 8 },

  // Cover + Avatar (mirrors user_business_profile)
  coverSection: { marginBottom: 0 },
  coverPhoto: {
    height: 150, backgroundColor: '#d0d0d0',
    overflow: 'hidden',
  },
  avatarWrapper: { marginTop: -36, marginLeft: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#d0d0d0', borderWidth: 3, borderColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarIcon: { fontSize: 22, opacity: 0.5 },
  avatarImage: { width: '100%', height: '100%' },

  // Business info
  profileInfo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  businessName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 2 },
  eventName: { fontSize: 13, color: '#777', marginBottom: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  starFilled: { color: '#f59e0b', fontSize: 13 },
  ratingText: { fontSize: 13, color: '#444', fontWeight: '500' },
  followersText: { fontSize: 13, color: '#444', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: { flex: 1, backgroundColor: '#2E4A7A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  followingBtn: { backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#bbb' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followingBtnText: { color: '#333' },
  shareBtn: { flex: 1, backgroundColor: '#7AAED6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  shareBtnText: { color: '#2E4A7A', fontWeight: '700', fontSize: 14 },

  divider: { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16, marginBottom: 16 },

  // Menu section
  menuSection: { paddingHorizontal: 16 },
  menuHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  menuTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  cartBadge: { backgroundColor: '#2E4A7A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardUnavailable: { opacity: 0.5 },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 3 },
  itemNameUnavailable: { color: '#999' },
  itemDesc: { fontSize: 12, color: '#888', lineHeight: 17, marginBottom: 4 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#2E4A7A' },
  soldOutLabel: { fontSize: 11, color: '#ef4444', fontWeight: '700', marginTop: 2 },

  addBtn: { backgroundColor: '#2E4A7A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#2E4A7A', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyNum: { fontSize: 15, fontWeight: '800', color: '#111', minWidth: 18, textAlign: 'center' },

  // Sticky order bar
  orderBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0',
    padding: 16, paddingBottom: 28,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  orderBarInfo: { flex: 1 },
  orderBarQty: { fontSize: 12, color: '#888', fontWeight: '600' },
  orderBarTotal: { fontSize: 18, fontWeight: '900', color: '#111' },
  placeOrderBtn: { backgroundColor: '#2E4A7A', borderRadius: RADIUS, paddingHorizontal: 24, paddingVertical: 14 },
  placeOrderBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tagChip: { backgroundColor: '#dce9f5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagChipText: { fontSize: 12, color: '#2E4A7A', fontWeight: '600' },

  pickupSection: { paddingHorizontal: 16, marginBottom: 16 },
  pickupTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 10 },
  pickupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  pickupIcon: { fontSize: 18 },
  pickupAddress: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1 },
  pickupTimesLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 14, marginBottom: 10 },
  timeSlotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeSlotBtn: { borderRadius: 10, borderWidth: 1.5, borderColor: '#2E4A7A', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#fff' },
  timeSlotBtnActive: { backgroundColor: '#2E4A7A' },
  timeSlotText: { fontSize: 13, fontWeight: '700', color: '#2E4A7A' },
  timeSlotTextActive: { color: '#fff' },
});
