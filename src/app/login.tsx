import { Redirect } from 'expo-router';
import React from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { useTime } from '../store/TimeStore';

export default function LoginRoute() {
  const { user } = useTime();
  if (user) return <Redirect href="/(tabs)/tasks" />;
  return <LoginScreen />;
}
