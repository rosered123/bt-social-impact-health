import { imageSource } from "@/utils/imageSource";
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listBusinessesForCollaborate, type Business } from '@/services/api';

type Tab = 'discover' | 'requests' | 'partners';

type RequestStatus = 'none' | 'pending' | 'accepted';

// NOTE: There is no `collaboration_requests` table in the DB yet, so we keep
// request state in memory for the current session.
type RequestMap = Record<string, RequestStatus>;

type IncomingRequest = {
  id: string;
  from: Business;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  address: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
};

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

// ─── Vendor Card (Discover tab) ──────────────────────────────────────────────
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
          {business.logo_url ? (
            <Image source={imageSource(business.logo_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
          ) : (
            <Text style={styles.vendorAvatarText}>
              {(business.business_name ?? 'V').slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {business.business_name || 'Vendor name'}
          </Text>
          <Text style={styles.vendorDesc} numberOfLines={1}>
            {description}
          </Text>
          <View style={styles.vendorMetaRow}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.vendorMetaText}> {rating}</Text>
            <Text style={styles.vendorFollowers}>   {followers} followers</Text>
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
          <Feather name="send" size={13} color="#fff" style={{ marginRight: 5 }} />
          <Text style={styles.filledBtnText}>{sendLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Partner Card (Partners tab) ─────────────────────────────────────────────
const PartnerCard: React.FC<{
  business: Business;
  onViewProfile: () => void;
  onCoHost: () => void;
}> = ({ business, onViewProfile, onCoHost }) => {
  const rating = business.avg_rating != null ? Number(business.avg_rating).toFixed(1) : '—';
  const followers = business.follower_count ?? 0;
  const description = business.short_description || 'No description yet.';

  return (
    <View style={styles.partnerCard}>
      <View style={styles.vendorTop}>
        <View style={styles.vendorAvatar}>
          {business.logo_url ? (
            <Image source={imageSource(business.logo_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
          ) : (
            <Text style={styles.vendorAvatarText}>
              {(business.business_name ?? 'V').slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {business.business_name || 'Vendor name'}
          </Text>
          <Text style={styles.vendorDesc} numberOfLines={1}>
            {description}
          </Text>
          <View style={styles.vendorMetaRow}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.vendorMetaText}> {rating}</Text>
            <Text style={styles.vendorFollowers}>   {followers} followers</Text>
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
          style={styles.filledBtn}
          activeOpacity={0.85}
          onPress={onCoHost}
        >
          <Text style={styles.filledBtnText}>Co-Host Event</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Request Card ────────────────────────────────────────────────────────────
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

  const description = from.short_description || 'No description yet.';

  return (
    <View style={styles.requestCardOuter}>
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.vendorAvatar}>
            {from.logo_url ? (
              <Image source={imageSource(from.logo_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
            ) : (
              <Text style={styles.vendorAvatarText}>
                {(from.business_name ?? 'V').slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {from.business_name || 'Vendor name'}
            </Text>
            <Text style={styles.requestVendorDesc} numberOfLines={1}>{description}</Text>
            <View style={styles.vendorMetaRow}>
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.vendorMetaText}> {rating}</Text>
              <Text style={styles.vendorFollowers}>   {followers} followers</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventBlock}>
          <View style={styles.eventBlockInner}>
            <View style={styles.eventThumb}>
              {from.logo_url ? (
                <Image source={imageSource(from.logo_url)} style={{width: '100%', height: '100%'}} resizeMode="cover" />
              ) : null}
            </View>
            <View style={styles.eventBlockText}>
              <Text style={styles.eventName} numberOfLines={1}>{request.eventName}</Text>
              <Text style={styles.eventDetail}>
                {request.eventDate}  |  {request.startTime}– {request.endTime}
              </Text>
              <Text style={styles.eventDetail}>{request.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.requestMessageBubble}>
          <Text style={styles.requestMessage}>{request.message}</Text>
        </View>

        {resolved ? (
          <View style={[styles.resolvedBadge, accepted ? styles.resolvedAccepted : styles.resolvedDeclined]}>
            <Text style={styles.resolvedBadgeText}>
              {accepted ? 'Accepted' : 'Declined'}
            </Text>
          </View>
        ) : (
          <View style={styles.requestActions}>
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.85} onPress={onAccept}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} activeOpacity={0.75} onPress={onDecline}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
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

  const pendingCount = incoming.filter(r => r.status === 'pending').length;

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

  const MOCK_PARTNERS: Business[] = useMemo(() => [
    { uid: 'partner-1', business_name: 'Name', short_description: 'Description', avg_rating: 4.7, follower_count: 890, logo_url: null } as Business,
    { uid: 'partner-2', business_name: 'Name', short_description: 'Description', avg_rating: 4.7, follower_count: 890, logo_url: null } as Business,
    { uid: 'partner-3', business_name: 'Name', short_description: 'Description', avg_rating: 4.7, follower_count: 890, logo_url: null } as Business,
  ], []);

  const renderPartners = () => {
    return MOCK_PARTNERS.map(b => (
      <PartnerCard
        key={b.uid}
        business={b}
        onViewProfile={() => handleViewProfile(b.uid)}
        onCoHost={() => {}}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Yellow Header Section ── */}
        <View style={styles.yellowSection}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Collaborate</Text>
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
          <View>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'requests' && styles.tabBtnActive]}
              activeOpacity={0.8}
              onPress={() => setTab('requests')}
            >
              <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
                Request
              </Text>
            </TouchableOpacity>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'partners' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTab('partners')}
          >
            <Text style={[styles.tabText, tab === 'partners' && styles.tabTextActive]}>
              Partners
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color="#999" style={{ marginRight: 8 }} />
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
        </View>

        {/* ── Content ── */}
        <View style={styles.list}>
          {tab === 'discover' ? renderDiscover() : tab === 'requests' ? renderRequests() : renderPartners()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const RADIUS = 14;
const NAVY = '#2E4A7A';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

  // Yellow section
  yellowSection: {
    backgroundColor: '#FFF1AD',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#B4B4B4',
  },

  // Header
  header: {
    paddingTop: 48,
    marginBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111' },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1, 
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#c5e1f6',
    borderWidth: 1,
    borderColor: '#c5e1f6',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  tabText: { fontSize: 14, fontWeight: '300', color: '#000' },
  tabTextActive: { color: '#fff' },

  // Badge
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },

  // List
  list: { gap: 0, paddingTop: 14 },

  // Partner Card
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Vendor Card
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  vendorTop: { flexDirection: 'row', marginBottom: 12 },
  vendorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  vendorAvatarText: { fontSize: 20, fontWeight: '700', color: '#555' },
  vendorInfo: { flex: 1, justifyContent: 'center' },
  vendorName: { fontSize: 16, fontWeight: '800', color: '#111' },
  vendorDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  vendorMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  starIcon: { color: '#f59e0b', fontSize: 13 },
  vendorMetaText: { fontSize: 12, color: '#333', fontWeight: '600' },
  vendorFollowers: { fontSize: 12, color: '#555' },

  // Action buttons
  vendorActions: { flexDirection: 'row', gap: 10 },
  outlineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 20,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },
  filledBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingVertical: 9,
  },
  filledBtnDisabled: { opacity: 0.6 },
  filledBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Error / empty
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  emptyText: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  // Requests tab
  requestsSectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#555',
    marginTop: 12,
    marginBottom: 12,
  },
  requestCardOuter: {
    borderWidth: 1,
    borderColor: '#f0dfa0',
    borderRadius: RADIUS + 2,
    padding: 3,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS,
    padding: 14,
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  requestVendorDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  eventBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  eventBlockInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  eventBlockText: { flex: 1, gap: 3 },
  eventName: { fontSize: 14, fontWeight: '700', color: '#111' },
  eventDetail: { fontSize: 12, color: '#555', fontWeight: '500' },
  requestMessageBubble: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  requestMessage: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d6b3d',
    borderRadius: 20,
    paddingVertical: 10,
  },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  declineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 20,
    paddingVertical: 10,
  },
  declineBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },
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
