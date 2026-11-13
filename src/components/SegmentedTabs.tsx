import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export type SegmentedOption = {
  key: string;
  label: string;
};

type Props = {
  options: SegmentedOption[];
  active: string;
  onChange: (key: string) => void;
  activeColor?: string;
};

export function SegmentedTabs({ options, active, onChange, activeColor = COLORS.primary }: Props) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const isActive = option.key === active;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.tab, isActive && { backgroundColor: activeColor }]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#EEF1F9',
    borderRadius: 24,
    padding: 4,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  activeLabel: {
    color: '#FFFFFF',
  },
});
