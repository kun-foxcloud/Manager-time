import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUI } from '../store/UIStore';
import { COLORS } from '../theme';

type Props = {
  title: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, right }: Props) {
  const { openSidebar } = useUI();

  return (
    <View>
      <View style={styles.row}>
        <Pressable onPress={openSidebar} hitSlop={12}>
          <Ionicons name="menu-outline" size={26} color={COLORS.ink} />
        </Pressable>
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
  right: {
    flexDirection: 'row',
    alignItems: 'center',
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
