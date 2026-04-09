import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { listBusinessesForCollaborate, type Business } from '@/services/api';

type Tab = 'discover' | 'requests';

type RequestStatus = 'none' | 'pending' | 'accepted';

// NOTE: There is no `collaboration_requests` table in the DB yet, so we keep
// request state in memory for the current session. When that table is added
// this can be swapped out for real API calls without touching the UI.
type RequestMap = Record<string, RequestStatus>;

// Incoming co-host invite from another vendor. Mocked for now until a
// `collaboration_requests` table exists; the layout mirrors what a real row
// would carry so it's a 1:1 swap later.
type IncomingRequest = {
  id: string;
  from: Business;
  eventName: string;
  eventDate: string; // 'MM-DD-YYYY'
  startTime: string; // '1 PM'
  endTime: string; // '4 PM'
  address: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
};

// Sample incoming invites built on top of real fetched businesses so the
// Requests tab has a realistic preview until the backend is wired up.
const MOCK_INVITE_SEEDS: ReadonlyArray<Omit<IncomingRequest, 'id' | 'from'>> = [
  {
    eventName: 'Spring Night Market',
    eventDate: '05-18-2026',
    startTime: '1 PM',
    endTime: '4 PM',
    address: '123 Mission St, San Francisco',
    message: 'Collaborate message from brand!',
    status: 'pending',
  },
  {
    eventName: 'Sunset Pop-Up Fair',
    eventDate: '06-02-2026',
    startTime: '2 PM',
    endTime: '6 PM',
    address: '455 Valencia St, San Francisco',
    message: 'Would love to co-host our next event with you.',
    status: 'pending',
  },
];

function buildMockIncomingRequests(businesses: Business[]): IncomingRequest[] {
  return MOCK_INVITE_SEEDS.slice(0, businesses.length).map((seed, i) => ({
    id: `mock-${businesses[i].uid}`,
    from: businesses[i],
    ...seed,
  }));
}

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Text
        key={i}
        style={[{ fontSize: size }, i <= Math.round(rating) ? styles.starFilled : styles.starEmpty]}
      >
        ★
      </Text>
    ))}
  </View>
);

const VendorCard: React.FC<{
  business: Business;
  status: RequestStatus;
  onViewProfile: () => void;
  onSendRequest: () => void;
}> = ({ business, status, onViewProfile, onSendRequest }) => {
  const rating = business.avg_rating != null ? Number(business.avg_rating).toFixed(1) : '—';
  const followers = business.follower_count ?? 0;
  const description = business.short_description || 'No description yet.';

  const sendLabel =
    status === 'pending' ? 'Requested' : status === 'accepted' ? 'Connected' : 'Send Request';

  return (
    <View style={styles.vendorCard}>
      <View style={styles.vendorTop}>
        <View style={styles.vendorAvatar}>
          <Text style={styles.vendorAvatarText}>
            {(business.business_name ?? 'V').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {business.business_name || 'Vendor name'}
          </Text>
          <Text style={styles.vendorDesc} numberOfLines={2}>
            {description}
          </Text>
          <View style={styles.vendorMetaRow}>
            <StarRating rating={business.avg_rating ?? 0} />
            <Text style={styles.vendorMetaText}> {rating}</Text>
            <Text style={styles.vendorMetaDot}>·</Text>
            <Text style={styles.vendorMetaText}>{followers} followers</Text>
          </View>
        </View>
      </View>
      <View style={styles.vendorActions}>
        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.75}
          onPress={onViewProfile}
        >
          <Text style={styles.outlineBtnText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filledBtn, status !== 'none' && styles.filledBtnDisabled]}
          activeOpacity={0.85}
          onPress={onSendRequest}
          disabled={status !== 'none'}
        >
          <Text style={styles.filledBtnText}>{sendLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const IncomingRequestCard: React.FC<{
  request: IncomingRequest;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ request, onAccept, onDecline }) => {
  const { from } = request;
  const rating = from.avg_rating != null ? Number(from.avg_rating).toFixed(1) : '—';
  const followers = from.follower_count ?? 0;
  const accepted = request.status === 'accepted';
  const declined = request.status === 'declined';
  const resolved = accepted || declined;

  return (
    <View style={styles.requestCard}>
      {/* Vendor header */}
      <View style={styles.requestHeader}>
        <View style={styles.vendorAvatar}>
          <Text style={styles.vendorAvatarText}>
            {(from.business_name ?? 'V').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {from.business_name || 'Vendor name'}
          </Text>
          <View style={styles.vendorMetaRow}>
            <StarRating rating={from.avg_rating ?? 0} />
            <Text style={styles.vendorMetaText}> {rating}</Text>
            <Text style={styles.vendorMetaDot}>·</Text>
            <Text style={styles.vendorMetaText}>{followers} followers</Text>
          </View>
        </View>
      </View>

      {/* Event details */}
      <View style={styles.eventBlock}>
        <Text style={styles.eventName} numberOfLines={1}>{request.eventName}</Text>
        <Text style={styles.eventDetail}>
          📅 {request.eventDate}  |  {request.startTime}–{request.endTime}
        </Text>
        <Text style={styles.eventDetail}>📍 {request.address}</Text>
      </View>

      {/* Message */}
      <Text style={styles.requestMessage}>&ldquo;{request.message}&rdquo;</Text>

      {/* Actions */}
      {resolved ? (
        <View style={[styles.resolvedBadge, accepted ? styles.resolvedAccepted : styles.resolvedDeclined]}>
          <Text style={styles.resolvedBadgeText}>
            {accepted ? 'Accepted' : 'Declined'}
          </Text>
        </View>
      ) : (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.declineBtn}
            activeOpacity={0.75}
            onPress={onDecline}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            activeOpacity={0.85}
            onPress={onAccept}
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function CollaboratePage() {
  const [tab, setTab] = useState<Tab>('discover');
  const [search, setSearch] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [requests, setRequests] = useState<RequestMap>({});
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVendors = useCallback(async () => {
    try {
      setError(null);
      const data = await listBusinessesForCollaborate();
      setBusinesses(data);
      setIncoming(buildMockIncomingRequests(data));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(b => {
      const name = (b.business_name ?? '').toLowerCase();
      const desc = (b.short_description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [businesses, search]);

  const handleSendRequest = (uid: string) => {
    setRequests(prev => ({ ...prev, [uid]: 'pending' }));
  };

  const handleViewProfile = (uid: string) => {
    router.push({
      pathname: '/(tabs)/user_business_profile',
      params: { businessUid: uid },
    });
  };

  const handleAcceptInvite = (id: string) => {
    setIncoming(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'accepted' } : r)),
    );
  };

  const handleDeclineInvite = (id: string) => {
    setIncoming(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'declined' } : r)),
    );
  };

  const renderDiscover = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      );
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (filtered.length === 0) {
      return (
        <Text style={styles.emptyText}>
          {search.trim() ? 'No vendors match your search.' : 'No vendors to show yet.'}
        </Text>
      );
    }
    return filtered.map(b => (
      <VendorCard
        key={b.uid}
        business={b}
        status={requests[b.uid] ?? 'none'}
        onViewProfile={() => handleViewProfile(b.uid)}
        onSendRequest={() => handleSendRequest(b.uid)}
      />
    ));
  };

  const renderRequests = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      );
    }
    if (incoming.length === 0) {
      return (
        <>
          <Text style={styles.requestsSectionTitle}>Pending Co-Host Invite Requests</Text>
          <Text style={styles.emptyText}>No pending invites right now.</Text>
        </>
      );
    }
    return (
      <>
        <Text style={styles.requestsSectionTitle}>Pending Co-Host Invite Requests</Text>
        {incoming.map(r => (
          <IncomingRequestCard
            key={r.id}
            request={r}
            onAccept={() => handleAcceptInvite(r.id)}
            onDecline={() => handleDeclineInvite(r.id)}
          />
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collaborate</Text>
          <View style={styles.backBtn} />
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'discover' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTab('discover')}
          >
            <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'requests' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTab('requests')}
          >
            <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
              Requests
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        {tab === 'discover' ? (
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendors..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        ) : null}

        {/* ── List ── */}
        <View style={styles.list}>
          {tab === 'discover' ? renderDiscover() : renderRequests()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: { fontSize: 22, fontWeight: '700', color: '#333', lineHeight: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#111', fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 14, marginRight: 8, color: '#666' },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  list: { gap: 12 },
  vendorCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 14,
    marginBottom: 12,
  },
  vendorTop: { flexDirection: 'row', marginBottom: 12 },
  vendorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vendorAvatarText: { fontSize: 18, fontWeight: '700', color: '#555' },
  vendorInfo: { flex: 1, justifyContent: 'center' },
  vendorName: { fontSize: 15, fontWeight: '700', color: '#111' },
  vendorDesc: { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 16 },
  vendorMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  vendorMetaText: { fontSize: 12, color: '#555', fontWeight: '600' },
  vendorMetaDot: { fontSize: 12, color: '#999', marginHorizontal: 6 },
  vendorActions: { flexDirection: 'row', gap: 8 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingVertical: 9,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },
  filledBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 9,
  },
  filledBtnDisabled: { backgroundColor: '#888' },
  filledBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  starsRow: { flexDirection: 'row', gap: 1 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#ccc' },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  emptyText: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  requestsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: 14,
    marginBottom: 12,
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eventBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  eventName: { fontSize: 14, fontWeight: '700', color: '#111' },
  eventDetail: { fontSize: 12, color: '#555', fontWeight: '500' },
  requestMessage: {
    fontSize: 13,
    color: '#444',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 12,
  },
  requestActions: { flexDirection: 'row', gap: 8 },
  declineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingVertical: 9,
  },
  declineBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },
  acceptBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 9,
  },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  resolvedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resolvedAccepted: { backgroundColor: '#dcfce7' },
  resolvedDeclined: { backgroundColor: '#fee2e2' },
  resolvedBadgeText: { fontSize: 12, fontWeight: '700', color: '#111' },
});
