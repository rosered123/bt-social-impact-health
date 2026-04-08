import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  getEventById,
  getInventory,
  listMyEvents,
  updateMyEvent,
  upsertInventoryItem,
  type EventRow,
  type EventStatus,
  type InventoryItem,
} from '@/services/api';
import { notifyEventsChanged } from '@/services/refresh-bus';

type OverallStatus = 'Open' | 'Closing soon' | 'Sold Out' | 'Paused/Break';
type ProductAvailability =
  | 'Available - Full stock'
  | 'Available - Low stock'
  | 'Available - Limited menu'
  | 'Available - Closing early'
  | 'Closed for today';

const STATUS_MAP: Record<OverallStatus, EventStatus> = {
  'Open': 'open',
  'Closing soon': 'closing_soon',
  'Sold Out': 'sold_out',
  'Paused/Break': 'paused',
};

const AVAIL_MAP: Record<ProductAvailability, string> = {
  'Available - Full stock': 'full_stock',
  'Available - Low stock': 'low_stock',
  'Available - Limited menu': 'limited_menu',
  'Available - Closing early': 'closing_early',
  'Closed for today': 'closed_today',
};

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM',
];

const STATUS_DOT_COLORS: Record<OverallStatus, string> = {
  Open: '#22c55e',
  'Closing soon': '#eab308',
  'Sold Out': '#ef4444',
  'Paused/Break': '#6b7280',
};

const TimePicker: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timePickerWrapper}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <TouchableOpacity style={styles.timePickerBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.timePickerValue}>{value}</Text>
        <Text style={styles.timePickerChevron}>▼</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.timeDropdown}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity key={t} style={[styles.timeOption, t === value && styles.timeOptionSelected]} onPress={() => { onChange(t); setOpen(false); }}>
                <Text style={[styles.timeOptionText, t === value && styles.timeOptionTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const StatusButton: React.FC<{ status: OverallStatus; selected: boolean; onPress: () => void }> = ({ status, selected, onPress }) => (
  <TouchableOpacity style={[styles.statusBtn, selected && styles.statusBtnSelected]} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.statusDot, { backgroundColor: STATUS_DOT_COLORS[status] }]} />
    <Text style={[styles.statusBtnText, selected && styles.statusBtnTextSelected]}>{status}</Text>
  </TouchableOpacity>
);

const AvailabilityOption: React.FC<{ label: ProductAvailability; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
  <TouchableOpacity style={[styles.availOption, selected && styles.availOptionSelected]} onPress={onPress} activeOpacity={0.75}>
    <Text style={[styles.availOptionText, selected && styles.availOptionTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const AVAILABILITY_OPTIONS: ProductAvailability[] = [
  'Available - Full stock',
  'Available - Low stock',
  'Available - Limited menu',
  'Available - Closing early',
  'Closed for today',
];

type ProductState = {
  product_name: string;
  availability: ProductAvailability;
  custom_message: string;
};

const AVAIL_REVERSE: Record<string, ProductAvailability> = {
  full_stock: 'Available - Full stock',
  low_stock: 'Available - Low stock',
  limited_menu: 'Available - Limited menu',
  closing_early: 'Available - Closing early',
  closed_today: 'Closed for today',
};

// Reverse of STATUS_MAP. 'upcoming'/'closed'/'cancelled' default to 'Open'
// since entering the Update Status screen implies the owner is about to go live.
const STATUS_REVERSE: Partial<Record<EventStatus, OverallStatus>> = {
  open: 'Open',
  closing_soon: 'Closing soon',
  sold_out: 'Sold Out',
  paused: 'Paused/Break',
};

// Convert a DB time value like "11:00:00" or "11:00" into the picker format "11:00 AM".
function dbTimeToPicker(dbTime: string | null | undefined): string | null {
  if (!dbTime) return null;
  const [hStr, mStr] = dbTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h)) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

// Convert picker format "11:00 AM" back into DB time "11:00".
function pickerTimeToDb(pickerTime: string): string | null {
  const match = pickerTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export default function UpdateStatus() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [ending, setEnding] = useState(false);
  const [openTime, setOpenTime] = useState('11:00 AM');
  const [closeTime, setCloseTime] = useState('9:00 PM');
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('Open');
  const [location, setLocation] = useState('');
  const [products, setProducts] = useState<ProductState[]>([
    { product_name: 'General', availability: 'Available - Full stock', custom_message: '' },
  ]);
  const [newProductName, setNewProductName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Resolve which event to edit:
        // 1. If eventId was passed as a route param, load that specific event.
        // 2. Otherwise, prefer a currently-live event (status === 'open').
        // 3. Fall back to the most recent event.
        let target: EventRow | null = null;
        const parsedId = eventId ? Number(eventId) : null;
        if (parsedId !== null && !Number.isNaN(parsedId)) {
          target = await getEventById(parsedId);
        }
        if (!target) {
          const events = await listMyEvents(50);
          target = events.find(e => e.status === 'open') ?? events[0] ?? null;
        }
        if (cancelled || !target) return;

        setEvent(target);
        setLocation(target.location ?? '');
        const openFromDb = dbTimeToPicker(target.start_time);
        if (openFromDb) setOpenTime(openFromDb);
        const closeFromDb = dbTimeToPicker(target.end_time);
        if (closeFromDb) setCloseTime(closeFromDb);
        const mappedStatus = STATUS_REVERSE[target.status];
        if (mappedStatus) setOverallStatus(mappedStatus);

        const inventory = await getInventory(target.id);
        if (!cancelled && inventory.length > 0) {
          setProducts(inventory.map((item: InventoryItem) => ({
            product_name: item.product_name,
            availability: AVAIL_REVERSE[item.availability] ?? 'Available - Full stock',
            custom_message: item.custom_message ?? '',
          })));
        }
      } catch {
        // show form without event info
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const updateProduct = (index: number, patch: Partial<ProductState>) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
  };

  const addProduct = () => {
    const name = newProductName.trim();
    if (!name) return;
    if (products.some(p => p.product_name === name)) return;
    setProducts(prev => [...prev, { product_name: name, availability: 'Available - Full stock', custom_message: '' }]);
    setNewProductName('');
  };

  const handleUpdate = async () => {
    if (!event) {
      Alert.alert('No Event', 'Create an event first before updating its status.');
      return;
    }
    setSubmitting(true);
    try {
      await updateMyEvent(event.id, {
        status: STATUS_MAP[overallStatus],
        start_time: pickerTimeToDb(openTime),
        end_time: pickerTimeToDb(closeTime),
        location: location.trim() || null,
      });
      await Promise.all(products.map(p =>
        upsertInventoryItem(event.id, {
          product_name: p.product_name,
          availability: AVAIL_MAP[p.availability],
          custom_message: p.custom_message.trim() || null,
        })
      ));
      // Tell every subscribed screen to refetch so the event card reflects
      // the new status/times/location/products.
      notifyEventsChanged();
      setSubmitting(false);
      Alert.alert('Updated', 'Status has been updated.', [
        // setTimeout 0 so the Alert fully dismisses before we navigate,
        // avoiding iOS timing quirks that can swallow the navigation call.
        { text: 'OK', onPress: () => setTimeout(() => router.back(), 0) },
      ]);
      return;
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update status.');
      setSubmitting(false);
    }
  };

  const handleEndEvent = () => {
    if (!event) return;
    Alert.alert(
      'End this event?',
      `"${event.event_name}" will be moved to the Past tab. This cannot be undone from here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Event',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            try {
              await updateMyEvent(event.id, { status: 'closed' });
              notifyEventsChanged();
              setEnding(false);
              Alert.alert('Event Ended', 'Your event has been moved to Past.', [
                // setTimeout 0 so the Alert fully dismisses before we navigate.
                { text: 'OK', onPress: () => setTimeout(() => router.back(), 0) },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to end event.');
              setEnding(false);
            }
          },
        },
      ],
    );
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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Update Status</Text>
        <TouchableOpacity style={[styles.navUpdateBtn, submitting && { opacity: 0.5 }]} onPress={handleUpdate} disabled={submitting}>
          <Text style={styles.navUpdateText}>{submitting ? '…' : 'Update'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <View style={styles.currentStatusRow}>
            <View style={[styles.greenDot, { backgroundColor: STATUS_DOT_COLORS[overallStatus] }]} />
            <Text style={styles.currentStatusText}>Currently {overallStatus}</Text>
          </View>
          <Text style={styles.popupName}>{event?.event_name ?? 'No upcoming event'}</Text>
          <Text style={styles.popupSub}>{event?.location ?? '—'} · {event?.event_date ?? ''}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.clockIcon}>🕐</Text>
            <Text style={styles.sectionTitle}>Today's Hour</Text>
          </View>
          <View style={styles.timeRow}>
            <TimePicker label="Open at" value={openTime} onChange={setOpenTime} />
            <TimePicker label="Close at" value={closeTime} onChange={setCloseTime} />
          </View>
        </View>

        <Text style={styles.standaloneSectionTitle}>Overall Status</Text>
        <View style={styles.statusGrid}>
          {(['Open', 'Closing soon', 'Sold Out', 'Paused/Break'] as OverallStatus[]).map(s => (
            <StatusButton key={s} status={s} selected={overallStatus === s} onPress={() => setOverallStatus(s)} />
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.clockIcon}>📦</Text>
            <Text style={styles.sectionTitle}>Product Availability</Text>
          </View>
          {products.map((product, index) => (
            <View key={product.product_name} style={styles.productBlock}>
              <Text style={styles.productName}>{product.product_name}</Text>
              {AVAILABILITY_OPTIONS.map(opt => (
                <AvailabilityOption
                  key={opt}
                  label={opt}
                  selected={product.availability === opt}
                  onPress={() => updateProduct(index, { availability: opt })}
                />
              ))}
              <Text style={styles.customMsgLabel}>Custom Message</Text>
              <TextInput
                style={styles.customMsgInput}
                placeholder={'e.g. "Just restocked! ☕"'}
                placeholderTextColor="#aaa"
                value={product.custom_message}
                onChangeText={val => updateProduct(index, { custom_message: val })}
                multiline
              />
              {index < products.length - 1 && <View style={styles.productDivider} />}
            </View>
          ))}
          <View style={styles.addProductRow}>
            <TextInput
              style={styles.addProductInput}
              placeholder="Add product name..."
              placeholderTextColor="#aaa"
              value={newProductName}
              onChangeText={setNewProductName}
            />
            <TouchableOpacity style={styles.addProductBtn} onPress={addProduct}>
              <Text style={styles.addProductBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.clockIcon}>📍</Text>
          <Text style={styles.standaloneSectionTitle}>Current Location</Text>
        </View>
        <View style={styles.card}>
          <TextInput style={styles.locationInput} placeholder="Type location..." placeholderTextColor="#aaa" value={location} onChangeText={setLocation} />
        </View>

        <TouchableOpacity style={[styles.updateStatusBtn, submitting && { opacity: 0.5 }]} onPress={handleUpdate} activeOpacity={0.85} disabled={submitting}>
          <Text style={styles.updateStatusBtnText}>{submitting ? 'Updating…' : 'Update Status'}</Text>
        </TouchableOpacity>

        {event ? (
          <TouchableOpacity
            style={[styles.endEventBtn, ending && { opacity: 0.5 }]}
            onPress={handleEndEvent}
            activeOpacity={0.85}
            disabled={ending || submitting}
          >
            <Text style={styles.endEventBtnText}>{ending ? 'Ending…' : 'End Event'}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f5f5f5' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, fontWeight: '700', color: '#111' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  navUpdateBtn: { backgroundColor: '#222', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  navUpdateText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  standaloneSectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  clockIcon: { fontSize: 16 },
  currentStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  greenDot: { width: 10, height: 10, borderRadius: 5 },
  currentStatusText: { fontSize: 13, color: '#444', fontWeight: '500' },
  popupName: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 2 },
  popupSub: { fontSize: 12, color: '#888' },
  timeRow: { flexDirection: 'row', gap: 12 },
  timePickerWrapper: { flex: 1, zIndex: 10 },
  timePickerLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  timePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  timePickerValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  timePickerChevron: { fontSize: 10, color: '#666' },
  timeDropdown: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 8, zIndex: 100, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  timeOption: { paddingHorizontal: 12, paddingVertical: 9 },
  timeOptionSelected: { backgroundColor: '#f0f0f0' },
  timeOptionText: { fontSize: 13, color: '#333' },
  timeOptionTextSelected: { fontWeight: '700', color: '#111' },
  statusGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CARD_BG, borderRadius: RADIUS, paddingVertical: 12, paddingHorizontal: 4, gap: 6 },
  statusBtnSelected: { backgroundColor: '#d4d4d4', borderWidth: 2, borderColor: '#333' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusBtnText: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },
  statusBtnTextSelected: { color: '#111', fontWeight: '800' },
  availOption: { borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, backgroundColor: '#fff' },
  availOptionSelected: { borderColor: '#333', backgroundColor: '#e8e8e8' },
  availOptionText: { fontSize: 13, color: '#444' },
  availOptionTextSelected: { fontWeight: '700', color: '#111' },
  customMsgLabel: { fontSize: 13, fontWeight: '700', color: '#111', marginTop: 6, marginBottom: 6 },
  customMsgInput: { borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333', backgroundColor: '#fff', minHeight: 64, textAlignVertical: 'top' },
  locationInput: { borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333', backgroundColor: '#fff', marginBottom: 8 },
  updateStatusBtn: { backgroundColor: '#222', borderRadius: RADIUS, paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  updateStatusBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  endEventBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ef4444', borderRadius: RADIUS, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  endEventBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '800' },
  productBlock: { marginBottom: 8 },
  productName: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 8 },
  productDivider: { height: 1, backgroundColor: '#d0d0d0', marginVertical: 12 },
  addProductRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  addProductInput: { flex: 1, borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#333', backgroundColor: '#fff' },
  addProductBtn: { backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  addProductBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
