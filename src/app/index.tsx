import { Redirect } from 'expo-router';
import React from 'react';
import { useTime } from '../store/TimeStore';

export default function Index() {
  const { user } = useTime();
  return <Redirect href={user ? '/(tabs)/tasks' : '/login'} />;
}
