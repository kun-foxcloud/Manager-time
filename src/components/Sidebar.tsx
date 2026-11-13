import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTime } from '../store/TimeStore';
import { useUI } from '../store/UIStore';
import { COLORS, SHADOW } from '../theme';

const MENU = [
  { path: '/tasks', label: 'Tasks', icon: 'list-outline' },
  { path: '/reports', label: 'Reports', icon: 'bar-chart-outline' },
  { path: '/timer', label: 'Timer', icon: 'time-outline' },
  { path: '/payment', label: 'Payment', icon: 'card-outline' },
] as const;

const CHARGE_MENU_ITEM = { path: '/charge', label: 'Charge', icon: 'cash-outline' } as const;

const PANEL_WIDTH = 260;

export function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUI();
  const { user, logout } = useTime();
  const pathname = usePathname();
  const [translateX] = useState(() => new Animated.Value(-PANEL_WIDTH));

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: sidebarOpen ? 0 : -PANEL_WIDTH,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, translateX]);

  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          Animated.timing(translateX, {
            toValue: -PANEL_WIDTH,
            duration: 150,
            useNativeDriver: true,
          }).start(closeSidebar);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  );

  if (!user) return null;

  const menu = user.isAdmin ? [...MENU, CHARGE_MENU_ITEM] : MENU;

  const backdropOpacity = translateX.interpolate({
    inputRange: [-PANEL_WIDTH, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.overlay} pointerEvents={sidebarOpen ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
      </Animated.View>
      <Animated.View
        style={[styles.panelWrap, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.png')} style={styles.brandLogo} />
          <Text style={styles.appName}>Time Manager</Text>
        </View>
        {menu.map((item) => {
          const active = pathname === item.path;
          return (
            <Pressable
              key={item.path}
              onPress={() => {
                closeSidebar();
                router.push(item.path);
              }}
              style={[styles.menuItem, active && styles.menuItemActive]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? COLORS.primary : COLORS.muted}
              />
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.footer}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
          <Pressable
            onPress={() => {
              logout();
              closeSidebar();
              router.replace('/login');
            }}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={16} color={COLORS.muted} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  panelWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    ...SHADOW,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 22,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3E8F4',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#EDF3FE',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  menuLabelActive: {
    color: COLORS.primary,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  userRole: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
  },
});
