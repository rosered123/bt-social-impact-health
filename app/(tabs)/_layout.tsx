import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  const isBusiness = role === 'business';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {isBusiness ? (
        <>
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="create_business_event"
            options={{
              title: 'Create Event',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="pencil" color={color} />,
            }}
          />
          <Tabs.Screen
            name="update_status"
            options={{
              title: 'Status',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="business_profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
            }}
          />
          <Tabs.Screen name="explore" options={{ href: null }} />
          <Tabs.Screen name="profile" options={{ href: null }} />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Explore',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Account',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
            }}
          />
          <Tabs.Screen name="dashboard" options={{ href: null }} />
          <Tabs.Screen name="create_business_event" options={{ href: null }} />
          <Tabs.Screen name="update_status" options={{ href: null }} />
          <Tabs.Screen name="business_profile" options={{ href: null }} />
        </>
      )}

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="add_review" options={{ href: null }} />
      <Tabs.Screen name="edit_profile" options={{ href: null }} />
      <Tabs.Screen name="user_business_profile" options={{ href: null }} />
      <Tabs.Screen name="view_event" options={{ href: null }} />
    </Tabs>
  );
}
