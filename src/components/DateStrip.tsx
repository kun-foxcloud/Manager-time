import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';
import { MS, WEEKDAY_SHORT, addDays, startOfDay } from '../utils/time';

const ITEM_WIDTH = 52;

type Props = {
  startDayMs: number;
  endDayMs: number;
  selectedDayMs: number;
  onSelect: (dayMs: number) => void;
};

export function DateStrip({ startDayMs, endDayMs, selectedDayMs, onSelect }: Props) {
  const stripRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const startMs = startOfDay(startDayMs);
  const endMs = startOfDay(endDayMs);
  const selectedMs = startOfDay(selectedDayMs);

  const days = useMemo(
    () =>
      Array.from({ length: Math.round((endMs - startMs) / MS.DAY) + 1 }, (_, i) =>
        addDays(startMs, i),
      ),
    [startMs, endMs],
  );

  useEffect(() => {
    if (!viewportWidth) return;
    const index = Math.round((selectedMs - startMs) / MS.DAY);
    const x = index * ITEM_WIDTH - viewportWidth / 2 + ITEM_WIDTH / 2;
    stripRef.current?.scrollTo({ x: Math.max(0, x), animated: false });
  }, [selectedMs, viewportWidth, startMs]);

  return (
    <ScrollView
      ref={stripRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
      style={styles.strip}
      contentContainerStyle={styles.content}
    >
      {days.map((dayMs) => {
        const date = new Date(dayMs);
        const isSelected = dayMs === selectedMs;
        return (
          <Pressable key={dayMs} onPress={() => onSelect(dayMs)} style={styles.dayCell}>
            <Text style={[styles.weekday, isSelected && styles.selectedWeekday]}>
              {WEEKDAY_SHORT[(date.getDay() + 6) % 7]}
            </Text>
            <View style={[styles.numberWrap, isSelected && styles.selectedCircle]}>
              <Text style={[styles.dayNumber, isSelected && styles.selectedNumber]}>
                {date.getDate()}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexGrow: 0,
    marginTop: 16,
  },
  content: {
    alignItems: 'center',
  },
  dayCell: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekday: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  selectedWeekday: {
    color: COLORS.primary,
  },
  numberWrap: {
    marginTop: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  selectedNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
