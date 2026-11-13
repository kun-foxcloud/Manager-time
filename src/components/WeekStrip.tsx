import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, isSameDay, startOfWeek } from '../utils/time';
import { COLORS } from '../theme';

type Props = {
  selectedDayMs: number;
  onSelect: (dayMs: number) => void;
};

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekStrip({ selectedDayMs, onSelect }: Props) {
  const monday = startOfWeek(selectedDayMs);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <View>
      <View style={styles.numbers}>
        {days.map((dayMs) => {
          const isSelected = isSameDay(dayMs, selectedDayMs);
          return (
            <Pressable
              key={dayMs}
              onPress={() => onSelect(dayMs)}
              style={[styles.dayDot, isSelected && styles.selectedDot]}
            >
              <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>
                {new Date(dayMs).getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.letters}>
        {LETTERS.map((letter, index) => (
          <Text key={`${letter}-${index}`} style={styles.letter}>
            {letter}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  numbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  letters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  letter: {
    width: 30,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
});
