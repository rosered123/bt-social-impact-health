import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function RowItem({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, value, onToggle }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#d0d0d0', true: '#2E4A7A' }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function Settings() {
  const { signOut } = useAuth();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [paymentNotifs, setPaymentNotifs] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth');
          } catch {
            Alert.alert('Error', 'Failed to log out.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <SectionHeader title="Profile Settings" />
          <View style={styles.card}>
            <RowItem icon="✦" label="Edit Interests" onPress={() => router.navigate('/(tabs)/edit_interests')} />
            <View style={styles.separator} />
            <RowItem icon="💳" label="Payment Methods" onPress={() => {}} />
            <View style={styles.separator} />
            <RowItem icon="🔒" label="Security & Privacy" onPress={() => {}} />
            <View style={styles.separator} />
            <RowItem icon="🛡️" label="Account Type" onPress={() => {}} />
          </View>

          <SectionHeader title="Notifications" />
          <View style={styles.card}>
            <ToggleRow icon="🔔" label="Push Notifications" value={pushNotifs} onToggle={setPushNotifs} />
            <View style={styles.separator} />
            <ToggleRow icon="💳" label="Payment Methods" value={paymentNotifs} onToggle={setPaymentNotifs} />
          </View>

          <SectionHeader title="Support" />
          <View style={styles.card}>
            <RowItem icon="❓" label="Help Center" onPress={() => {}} />
            <View style={styles.separator} />
            <RowItem icon="📄" label="Terms & Privacy" onPress={() => {}} />
          </View>

          <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.signOutIcon}>↪</Text>
            <Text style={styles.signOutText}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  content: { flex: 1, backgroundColor: '#f0f0f0' },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF1AD',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 18, color: '#111' },
  navTitle: { fontSize: 20, fontWeight: '900', color: '#111' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 16, marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 4,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 52 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { fontSize: 15, color: '#111', fontWeight: '500' },
  rowChevron: { fontSize: 22, color: '#bbb', fontWeight: '300' },

  signOutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    marginTop: 16,
  },
  signOutIcon: { fontSize: 18, width: 24, textAlign: 'center', color: '#ef4444' },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
