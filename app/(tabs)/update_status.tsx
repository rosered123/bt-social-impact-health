import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  Switch,
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

// Simplified display labels for the new pill UI
type AvailPill = 'Available' | 'Low Stock' | 'Sold Out';

const PILL_TO_AVAIL: Record<AvailPill, ProductAvailability> = {
  'Available': 'Available - Full stock',
  'Low Stock': 'Available - Low stock',
  'Sold Out': 'Closed for today',
};

const AVAIL_TO_PILL: Record<ProductAvailability, AvailPill> = {
  'Available - Full stock': 'Available',
  'Available - Low stock': 'Low Stock',
  'Available - Limited menu': 'Low Stock',
  'Available - Closing early': 'Low Stock',
  'Closed for today': 'Sold Out',
};

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

const PILL_COLORS: Record<AvailPill, { bg: string; border: string }> = {
  'Available': { bg: '#22c55e', border: '#22c55e' },
  'Low Stock': { bg: '#f59e0b', border: '#f59e0b' },
  'Sold Out': { bg: '#ef4444', border: '#ef4444' },
};

const STATUS_DOT_COLORS: Record<OverallStatus, string> = {
  Open: '#22c55e',
  'Closing soon': '#eab308',
  'Sold Out': '#ef4444',
  'Paused/Break': '#3b82f6',
};

const STATUS_SELECTED_BG: Record<OverallStatus, string> = {
  Open: '#e8f8e8',
  'Closing soon': '#fef9e7',
  'Sold Out': '#fde8e8',
  'Paused/Break': '#e8f0fe',
};

const AVAIL_REVERSE: Record<string, ProductAvailability> = {
  full_stock: 'Available - Full stock',
  low_stock: 'Available - Low stock',
  limited_menu: 'Available - Limited menu',
  closing_early: 'Available - Closing early',
  closed_today: 'Closed for today',
};

const STATUS_REVERSE: Partial<Record<EventStatus, OverallStatus>> = {
  open: 'Open',
  closing_soon: 'Closing soon',
  sold_out: 'Sold Out',
  paused: 'Paused/Break',
};

const TimePicker: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timePickerWrapper}>
      <TouchableOpacity style={styles.timePickerBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.timePickerValue}>{value}</Text>
        <Feather name="chevron-down" size={14} color="#666" />
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

type ProductState = {
  product_name: string;
  availability: ProductAvailability;
  custom_message: string;
  preOrder: boolean;
};

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
  const [customMessage, setCustomMessage] = useState('');
  const [pushNotification, setPushNotification] = useState(false);
  const [products, setProducts] = useState<ProductState[]>([
    { product_name: 'General', availability: 'Available - Full stock', custom_message: '', preOrder: false },
  ]);
  const [newProductName, setNewProductName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
            preOrder: false,
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
    setProducts(prev => [...prev, { product_name: name, availability: 'Available - Full stock', custom_message: '', preOrder: false }]);
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
          custom_message: p.custom_message.trim() || customMessage.trim() || null,
        })
      ));
      notifyEventsChanged();
      setSubmitting(false);
      Alert.alert('Updated', 'Status has been updated.', [
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      {/* Golden gradient header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Status Update</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerUpdateBtn, submitting && { opacity: 0.5 }]}
            onPress={handleUpdate}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#3E5F8D', '#648EC9', '#3E5F8D']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.headerUpdateGradient}
            >
              <Text style={styles.headerUpdateText}>{submitting ? '...' : 'Update'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Menu Stock Section */}
        <View style={styles.menuStockWrapper}>
          {/* Section header */}
          <View style={styles.menuStockHeader}>
            <Feather name="check-square" size={18} color="#333" />
            <Text style={styles.menuStockTitle}>Menu Stock</Text>
          </View>

          {products.map((product, index) => (
            <View key={product.product_name} style={styles.productCard}>
              <View style={styles.productNameRow}>
                <Text style={styles.productName}>{product.product_name}</Text>
              </View>
              {product.custom_message ? (
                <Text style={styles.productDescription}>{product.custom_message}</Text>
              ) : null}

              {/* Availability pills */}
              <View style={styles.pillRow}>
                {(['Available', 'Low Stock', 'Sold Out'] as AvailPill[]).map(pill => {
                  const currentPill = AVAIL_TO_PILL[product.availability];
                  const selected = currentPill === pill;
                  const selectedStyle = selected ? PILL_COLORS[pill] : null;
                  return (
                    <TouchableOpacity
                      key={pill}
                      style={[
                        styles.pill,
                        selected && { backgroundColor: selectedStyle?.bg, borderColor: selectedStyle?.border },
                      ]}
                      onPress={() => updateProduct(index, { availability: PILL_TO_AVAIL[pill] })}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{pill}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Pre-Orders link */}
              <TouchableOpacity
                style={styles.preOrderRow}
                onPress={() => router.push('/(tabs)/pre_orders')}
                activeOpacity={0.75}
              >
                <Text style={styles.preOrderLabel}>Pre-Orders</Text>
                <Feather name="chevron-right" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add product */}
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

        {/* Location */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.sectionInput}>
            <TextInput
              style={styles.locationInput}
              placeholder="Type location..."
              placeholderTextColor="#aaa"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Hours */}
        <View style={[styles.sectionCard, { zIndex: 10 }]}>
          <Text style={styles.sectionTitle}>Hours</Text>
          <View style={styles.timeRow}>
            <TimePicker value={openTime} onChange={setOpenTime} />
            <Text style={styles.timeSeparator}>–</Text>
            <TimePicker value={closeTime} onChange={setCloseTime} />
          </View>
        </View>

        {/* Overall Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overall Status</Text>
          <View style={styles.statusGrid}>
            {(['Open', 'Closing soon', 'Sold Out', 'Paused/Break'] as OverallStatus[]).map(s => {
              const selected = overallStatus === s;
              const displayLabel = s === 'Paused/Break' ? 'Break' : s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, selected && { backgroundColor: STATUS_SELECTED_BG[s] }]}
                  onPress={() => setOverallStatus(s)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.statusDot, { backgroundColor: STATUS_DOT_COLORS[s] }]} />
                  <Text style={[styles.statusBtnText, selected && styles.statusBtnTextSelected]}>{displayLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Custom Message (Optional)</Text>
          <View style={styles.sectionInput}>
            <TextInput
              style={styles.customMsgInput}
              placeholder="Write a custom message..."
              placeholderTextColor="#aaa"
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
            />
          </View>
        </View>

        {/* Push Notification */}
        <View style={styles.pushNotifRow}>
          <Feather name="bell" size={20} color="#111" />
          <Text style={styles.pushNotifLabel}>Push Notification</Text>
          <View style={{ flex: 1 }} />
          <Switch
            value={pushNotification}
            onValueChange={setPushNotification}
            trackColor={{ false: '#d8d8d8', true: '#22c55e' }}
            thumbColor="#fff"
          />
        </View>

        {/* Update Status Button */}
        <TouchableOpacity
          style={[styles.updateStatusBtn, submitting && { opacity: 0.5 }]}
          onPress={handleUpdate}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <LinearGradient
            colors={['#3E5F8D', '#648EC9', '#3E5F8D']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.updateStatusGradient}
          >
            <Text style={styles.updateStatusBtnText}>{submitting ? 'Updating...' : 'Update Status'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* End Event Button */}
        {event ? (
          <TouchableOpacity
            style={[styles.endEventBtn, ending && { opacity: 0.5 }]}
            onPress={handleEndEvent}
            activeOpacity={0.85}
            disabled={ending || submitting}
          >
            <Text style={styles.endEventBtnText}>{ending ? 'Ending...' : 'End Event'}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  /* Header */
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF1AD',
    borderBottomWidth: 1,
    borderBottomColor: '#B4B4B4',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  headerUpdateBtn: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  headerUpdateGradient: {
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  headerUpdateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  scroll: { flex: 1, paddingHorizontal: 16 },

  /* Menu Stock Wrapper (gradient background) */
  menuStockWrapper: {
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#7AAED6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
  },
  menuStockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuStockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },

  /* Product Cards */
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  productDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },

  /* Availability Pills */
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d8d8d8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  pillSelected: {},
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pillTextSelected: {
    color: '#fff',
  },

  /* Pre-Orders */
  preOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 10,
  },
  preOrderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
  },

  /* Add product */
  addProductRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  addProductInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  addProductBtn: {
    backgroundColor: '#555',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  addProductBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Section Card (white box wrapping title + content) */
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  sectionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  /* Location */
  locationInput: {
    fontSize: 14,
    color: '#333',
  },

  /* Time Pickers */
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  timePickerWrapper: {
    flex: 1,
    zIndex: 10,
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timePickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  timeDropdown: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
  },
  timeOptionTextSelected: {
    fontWeight: '700',
    color: '#111',
  },

  /* Overall Status */
  statusGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBtnSelected: {},
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  statusBtnTextSelected: {
    color: '#111',
    fontWeight: '800',
  },

  /* Custom Message */
  customMsgInput: {
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  /* Push Notification */
  pushNotifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  pushNotifLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },

  /* Update Status Button */
  updateStatusBtn: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },
  updateStatusGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 50,
  },
  updateStatusBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  /* End Event Button */
  endEventBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  endEventBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '800',
  },
});
