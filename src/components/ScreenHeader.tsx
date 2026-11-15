import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTime } from '../store/TimeStore';
import { useUI } from '../store/UIStore';
import { COLORS } from '../theme';

type Props = {
  title: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, right }: Props) {
  const { openSidebar } = useUI();
  const { user } = useTime();

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.left}>
          <Pressable onPress={openSidebar} hitSlop={12}>
            <Ionicons name="menu-outline" size={26} color={COLORS.ink} />
          </Pressable>
          {user && (
            <View style={styles.userChip}>
              <View style={[styles.userAvatar, { backgroundColor: user.color }]}>
                <Text style={styles.userAvatarText}>{user.initials}</Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.right}>
          {right ?? (
            <>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.muted} />
              <View style={styles.rightGap} />
              <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={COLORS.muted} />
            </>
          )}
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  rightGap: {
    width: 14,
  },
  title: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.ink,
  },
});
