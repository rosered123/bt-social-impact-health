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

// ─── Types ───────────────────────────────────────────────────────────────────
type OverallStatus = 'Open' | 'Closing soon' | 'Sold Out' | 'Paused/Break';
type ProductAvailability =
  | 'Available - Full stock'
  | 'Available - Low stock'
  | 'Available - Limited menu'
  | 'Available - Closing early'
  | 'Closed - Opens tomorrow'
  | 'Closed for today';

// ─── Time Picker (simple dropdown-style selector) ────────────────────────────
const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM',
];

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ label, value, onChange }) => {
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
              <TouchableOpacity
                key={t}
                style={[styles.timeOption, t === value && styles.timeOptionSelected]}
                onPress={() => { onChange(t); setOpen(false); }}
              >
                <Text style={[styles.timeOptionText, t === value && styles.timeOptionTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ─── Overall Status Button ────────────────────────────────────────────────────
const STATUS_DOT_COLORS: Record<OverallStatus, string> = {
  Open: '#22c55e',
  'Closing soon': '#eab308',
  'Sold Out': '#ef4444',
  'Paused/Break': '#6b7280',
};

interface StatusButtonProps {
  status: OverallStatus;
  selected: boolean;
  onPress: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({ status, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.statusBtn, selected && styles.statusBtnSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.statusDot, { backgroundColor: STATUS_DOT_COLORS[status] }]} />
    <Text style={[styles.statusBtnText, selected && styles.statusBtnTextSelected]}>
      {status}
    </Text>
  </TouchableOpacity>
);

// ─── Availability Option ──────────────────────────────────────────────────────
interface AvailabilityOptionProps {
  label: ProductAvailability;
  selected: boolean;
  onPress: () => void;
}

const AvailabilityOption: React.FC<AvailabilityOptionProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.availOption, selected && styles.availOptionSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.availOptionText, selected && styles.availOptionTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Checkbox Row ─────────────────────────────────────────────────────────────
interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ label, checked, onToggle }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.75}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AVAILABILITY_OPTIONS: ProductAvailability[] = [
  'Available - Full stock',
  'Available - Low stock',
  'Available - Limited menu',
  'Available - Closing early',
  'Closed - Opens tomorrow',
  'Closed for today',
];

const NOTIFICATION_OPTIONS = [
  'Notify my followers about this update',
  'Show on map & explore page',
  'Send push notification + in-app update',
];

export default function UpdateStatus() {
  const [openTime, setOpenTime] = useState('11:00 AM');
  const [closeTime, setCloseTime] = useState('9:00 PM');
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('Open');
  const [availability, setAvailability] = useState<ProductAvailability>('Available - Full stock');
  const [customMessage, setCustomMessage] = useState('');
  const [location, setLocation] = useState('');
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    'Notify my followers about this update': true,
    'Show on map & explore page': true,
    'Send push notification + in-app update': true,
  });

  const toggleNotification = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdate = () => {
    // Handle update logic here
    console.log({ openTime, closeTime, overallStatus, availability, customMessage, location, notifications });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* ── Nav Bar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Update Status</Text>
        <TouchableOpacity style={styles.navUpdateBtn} onPress={handleUpdate}>
          <Text style={styles.navUpdateText}>Update</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Current Status Banner ── */}
        <View style={styles.card}>
          <View style={styles.currentStatusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.currentStatusText}>Currently Open</Text>
          </View>
          <Text style={styles.popupName}>Pop-up events name</Text>
          <Text style={styles.popupSub}>Location · Today ##AM - ##PM</Text>
        </View>

        {/* ── Today's Hours ── */}
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

        {/* ── Overall Status ── */}
        <Text style={styles.standaloneSectionTitle}>Overall Status</Text>
        <View style={styles.statusGrid}>
          {(['Open', 'Closing soon', 'Sold Out', 'Paused/Break'] as OverallStatus[]).map(s => (
            <StatusButton
              key={s}
              status={s}
              selected={overallStatus === s}
              onPress={() => setOverallStatus(s)}
            />
          ))}
        </View>

        {/* ── Product Availability ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.clockIcon}>📦</Text>
            <Text style={styles.sectionTitle}>Product Availability</Text>
          </View>
          {AVAILABILITY_OPTIONS.map(opt => (
            <AvailabilityOption
              key={opt}
              label={opt}
              selected={availability === opt}
              onPress={() => setAvailability(opt)}
            />
          ))}

          <Text style={styles.customMsgLabel}>Custom Status Message</Text>
          <TextInput
            style={styles.customMsgInput}
            placeholder={'e.g. "Just restocked matcha lattes! Come grab one ☕"'}
            placeholderTextColor="#aaa"
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
          />
        </View>

        {/* ── Current Location ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.clockIcon}>📍</Text>
          <Text style={styles.standaloneSectionTitle}>Current Location</Text>
        </View>
        <View style={styles.card}>
          <TextInput
            style={styles.locationInput}
            placeholder="Type location..."
            placeholderTextColor="#aaa"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity>
            <Text style={styles.useCurrentLocation}>Use my current location</Text>
          </TouchableOpacity>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.clockIcon}>🔔</Text>
          <Text style={styles.standaloneSectionTitle}>Notifications</Text>
        </View>
        <View style={styles.card}>
          {NOTIFICATION_OPTIONS.map(opt => (
            <CheckboxRow
              key={opt}
              label={opt}
              checked={notifications[opt]}
              onToggle={() => toggleNotification(opt)}
            />
          ))}
        </View>

        {/* ── Update Button ── */}
        <TouchableOpacity style={styles.updateStatusBtn} onPress={handleUpdate} activeOpacity={0.85}>
          <Text style={styles.updateStatusBtnText}>Update Status</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f5f5f5',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  navUpdateBtn: { backgroundColor: '#222', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  navUpdateText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Card
  card: { backgroundColor: CARD_BG, borderRadius: RADIUS, padding: 14, marginBottom: 14 },

  // Section titles
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  standaloneSectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 10 },
  clockIcon: { fontSize: 16 },

  // Current Status Banner
  currentStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  currentStatusText: { fontSize: 13, color: '#444', fontWeight: '500' },
  popupName: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 2 },
  popupSub: { fontSize: 12, color: '#888' },

  // Time Picker
  timeRow: { flexDirection: 'row', gap: 12 },
  timePickerWrapper: { flex: 1, zIndex: 10 },
  timePickerLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  timePickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  timePickerValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  timePickerChevron: { fontSize: 10, color: '#666' },
  timeDropdown: {
    position: 'absolute', top: 60, left: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 8, zIndex: 100,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  timeOption: { paddingHorizontal: 12, paddingVertical: 9 },
  timeOptionSelected: { backgroundColor: '#f0f0f0' },
  timeOptionText: { fontSize: 13, color: '#333' },
  timeOptionTextSelected: { fontWeight: '700', color: '#111' },

  // Overall Status
  statusGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: CARD_BG, borderRadius: RADIUS,
    paddingVertical: 12, paddingHorizontal: 4, gap: 6,
  },
  statusBtnSelected: { backgroundColor: '#d4d4d4', borderWidth: 2, borderColor: '#333' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusBtnText: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },
  statusBtnTextSelected: { color: '#111', fontWeight: '800' },

  // Availability
  availOption: {
    borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8,
    backgroundColor: '#fff',
  },
  availOptionSelected: { borderColor: '#333', backgroundColor: '#e8e8e8' },
  availOptionText: { fontSize: 13, color: '#444' },
  availOptionTextSelected: { fontWeight: '700', color: '#111' },

  // Custom Message
  customMsgLabel: { fontSize: 13, fontWeight: '700', color: '#111', marginTop: 6, marginBottom: 6 },
  customMsgInput: {
    borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333',
    backgroundColor: '#fff', minHeight: 64, textAlignVertical: 'top',
  },

  // Location
  locationInput: {
    borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#333',
    backgroundColor: '#fff', marginBottom: 8,
  },
  useCurrentLocation: { fontSize: 13, color: '#4f7df0', fontWeight: '600', textAlign: 'center' },

  // Notifications
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#999',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#222', borderColor: '#222' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  checkboxLabel: { flex: 1, fontSize: 13, color: '#333' },

  // Bottom Update Button
  updateStatusBtn: {
    backgroundColor: '#222', borderRadius: RADIUS,
    paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 8,
  },
  updateStatusBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});