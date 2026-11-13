import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Sidebar } from '../../components/Sidebar';
import { useTime } from '../../store/TimeStore';
import { UIProvider } from '../../store/UIStore';
import { COLORS } from '../../theme';

const iconColor = (color: unknown): string =>
  typeof color === 'string' ? color : COLORS.primary;

export default function TabsLayout() {
  const { user } = useTime();

  if (!user) return <Redirect href="/login" />;

  return (
    <UIProvider>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={iconColor(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" color={iconColor(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={iconColor(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: 'Payment',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" color={iconColor(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="charge"
        options={{
          title: 'Charge',
          href: user.isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" color={iconColor(color)} size={size} />
          ),
        }}
      />
      </Tabs>
      <Sidebar />
    </UIProvider>
  );
}
