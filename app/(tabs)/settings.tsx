import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress?: () => void;
  showArrow?: boolean;
  trailing?: React.ReactNode;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, onPress, showArrow = true, trailing }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <View style={styles.rowIconCircle}>
      <Feather name={icon} size={20} color="#000" />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    {trailing ?? (showArrow ? <Feather name="chevron-right" size={20} color="#999" /> : null)}
  </TouchableOpacity>
);

export default function Settings() {
  const { signOut } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(false);
  const [paymentNotifications, setPaymentNotifications] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to log out.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#efefef" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Business Settings */}
        <Text style={styles.sectionLabel}>Business Settings</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="user"
            label="Edit Business Profile"
            onPress={() => router.push('/(tabs)/edit_profile?from=settings')}
          />
          <View style={styles.divider} />
          <SettingsRow icon="credit-card" label="Payment Methods" />
          <View style={styles.divider} />
          <SettingsRow icon="lock" label="Security & Privacy" />
          <View style={styles.divider} />
          <SettingsRow icon="shield" label="Account Type" />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="bell"
            label="Push Notifications"
            showArrow={false}
            trailing={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#d8d8d8', true: '#22c55e' }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="credit-card"
            label="Payment Methods"
            showArrow={false}
            trailing={
              <Switch
                value={paymentNotifications}
                onValueChange={setPaymentNotifications}
                trackColor={{ false: '#d8d8d8', true: '#22c55e' }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <SettingsRow icon="help-circle" label="Help Center" />
          <View style={styles.divider} />
          <SettingsRow icon="file-text" label="Terms & Privacy" />
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logOutCard} onPress={handleSignOut} activeOpacity={0.75}>
          <Feather name="log-out" size={20} color="red" style={{ marginRight: 14 }} />
          <Text style={styles.logOutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#efefef' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#000' },
  headerDivider: { height: 1, backgroundColor: '#d8d8d8' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  sectionLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginTop: 15,
    marginBottom: 8,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#d8d8d8',
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12.5,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '400',
    color: '#000',
  },

  divider: {
    height: 1,
    backgroundColor: '#e8e8e8',
  },

  logOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#d8d8d8',
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12.5,
    elevation: 3,
  },
  logOutText: { fontSize: 18, fontWeight: '400', color: 'red' },
});
