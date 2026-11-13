import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { TimeProvider, useTime } from '../store/TimeStore';
import { COLORS } from '../theme';

function AppStack() {
  const { hydrated } = useTime();
  if (!hydrated) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <TimeProvider>
      <StatusBar style="dark" />
      <AppStack />
    </TimeProvider>
  );
}
