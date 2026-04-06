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
      <Tabs.Screen
        name="dashboard"
        options={
          isBusiness
            ? {
                title: 'Dashboard',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="create_business_event"
        options={
          isBusiness
            ? {
                title: 'Create Event',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="pencil" color={color} />,
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="update_status"
        options={
          isBusiness
            ? {
                title: 'Status',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="business_profile"
        options={
          isBusiness
            ? {
                title: 'Profile',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="edit_profile"
        options={
          isBusiness
            ? {
                title: 'Edit Profile',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="pencil.circle.fill" color={color} />,
              }
            : { href: null }
        }
      />

      <Tabs.Screen
        name="explore"
        options={
          isBusiness
            ? { href: null }
            : {
                title: 'Explore',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }
        }
      />
      <Tabs.Screen
        name="profile"
        options={
          isBusiness
            ? { href: null }
            : {
                title: 'Account',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
              }
        }
      />
      <Tabs.Screen
        name="add_review"
        options={
          isBusiness
            ? { href: null }
            : {
                title: 'Write Review',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.and.pencil" color={color} />,
              }
        }
      />
      <Tabs.Screen
        name="view_event"
        options={
          isBusiness
            ? { href: null }
            : {
                title: 'View Event',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
              }
        }
      />
      <Tabs.Screen
        name="user_business_profile"
        options={
          isBusiness
            ? { href: null }
            : {
                title: 'Business',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.2.fill" color={color} />,
              }
        }
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />

      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
