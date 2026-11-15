import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import {
  MONTH_LONG,
  WEEKDAY_SHORT,
  addDays,
  addMonths,
  startOfDay,
  startOfMonth,
} from '../utils/time';

const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 12;
const HEADING_SPACE = 56;
const HEADING_HEIGHT = 28;

type MonthBlock = {
  startMs: number;
  year: number;
  monthIndex: number;
  daysInMonth: number;
  leadingBlanks: number;
  rows: number;
};

function buildMonth(startMs: number): MonthBlock {
  const d = new Date(startMs);
  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = (d.getDay() + 6) % 7;
  return {
    startMs,
    year,
    monthIndex,
    daysInMonth,
    leadingBlanks,
    rows: Math.ceil((leadingBlanks + daysInMonth) / 7),
  };
}

type ValueProps =
  | {
      mode: 'single';
      selectedDayMs: number;
      onSelect: (dayMs: number) => void;
    }
  | {
      mode: 'range';
      rangeStartMs: number;
      rangeEndMs: number;
      onSelectRange: (startMs: number, endMs: number) => void;
    };

type Props = ValueProps & { onClose: () => void };

type ContentProps = ValueProps & { onBack: () => void };

export function CalendarPicker(props: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={props.onClose}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <CalendarContent {...props} onBack={props.onClose} />
      </View>
    </Modal>
  );
}

export function CalendarContent(props: ContentProps) {
  const { onBack } = props;
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<MonthBlock>>(null);
  const [nowMs] = useState(() => Date.now());
  const [pendingStartMs, setPendingStartMs] = useState<number | null>(null);

  const isRange = props.mode === 'range';
  const onSelectDay = props.mode === 'single' ? props.onSelect : null;
  const onSelectRange = props.mode === 'range' ? props.onSelectRange : null;

  const todayStart = startOfDay(nowMs);
  const selectedStartMs = props.mode === 'single' ? startOfDay(props.selectedDayMs) : 0;
  const propRangeStartMs = props.mode === 'range' ? startOfDay(props.rangeStartMs) : 0;
  const propRangeEndMs = props.mode === 'range' ? startOfDay(props.rangeEndMs) : 0;
  const rangeStartMs = pendingStartMs ?? propRangeStartMs;
  const rangeEndMs = pendingStartMs ?? propRangeEndMs;

  const cellWidth = (width - 44) / 7;
  const cellHeight = Math.round(cellWidth) + 6;

  const months = useMemo(() => {
    const first = addMonths(startOfMonth(nowMs), -MONTHS_BEFORE);
    return Array.from({ length: MONTHS_BEFORE + MONTHS_AFTER + 1 }, (_, i) =>
      buildMonth(addMonths(first, i)),
    );
  }, [nowMs]);

  const monthOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    for (const m of months) {
      offsets.push(offset);
      offset += HEADING_SPACE + HEADING_HEIGHT + m.rows * cellHeight;
    }
    return offsets;
  }, [months, cellHeight]);

  const focusMonthStart = startOfMonth(isRange ? propRangeEndMs : selectedStartMs);
  const selectedIndex = months.findIndex((m) => m.startMs === focusMonthStart);
  const todayIndex = MONTHS_BEFORE;
  const initialIndex = selectedIndex >= 0 ? selectedIndex : todayIndex;

  const handleDayPress = (dayMs: number) => {
    if (onSelectRange) {
      if (pendingStartMs === null) {
        setPendingStartMs(dayMs);
        return;
      }
      onSelectRange(Math.min(pendingStartMs, dayMs), Math.max(pendingStartMs, dayMs));
      return;
    }
    onSelectDay?.(dayMs);
  };

  const getItemLayout = (_: unknown, index: number) => ({
    index,
    offset: monthOffsets[index],
    length: HEADING_SPACE + HEADING_HEIGHT + months[index].rows * cellHeight,
  });

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
  }, [initialIndex]);

  const renderMonth = (item: MonthBlock) => (
    <View style={{ paddingTop: HEADING_SPACE }}>
      <Text style={styles.monthTitle}>
        {MONTH_LONG[item.monthIndex]} {item.year}
      </Text>
      {Array.from({ length: item.rows }, (_, row) => {
        const firstDay = row * 7 - item.leadingBlanks + 1;
        const rowStartMs = addDays(item.startMs, firstDay - 1);
        const rowEndMs = addDays(item.startMs, firstDay + 6);
        const showBand = isRange && rowEndMs >= rangeStartMs && rowStartMs <= rangeEndMs;
        return (
          <View key={row} style={[styles.gridRow, showBand && styles.rangeRow]}>
            {Array.from({ length: 7 }, (_, col) => {
              const day = firstDay + col;
              if (day < 1 || day > item.daysInMonth) {
                return <View key={col} style={{ width: cellWidth, height: cellHeight }} />;
              }
              const dayMs = addDays(item.startMs, day - 1);
              const isEndpoint = isRange && (dayMs === rangeStartMs || dayMs === rangeEndMs);
              const isSelected = isRange ? isEndpoint : dayMs === selectedStartMs;
              const isToday = dayMs === todayStart;
              const disabled = dayMs > todayStart;
              return (
                <Pressable
                  key={col}
                  disabled={disabled}
                  onPress={() => handleDayPress(dayMs)}
                  style={[styles.cell, { width: cellWidth, height: cellHeight }]}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && !isSelected && styles.dayCircleToday,
                      isSelected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        disabled && styles.dayTextDisabled,
                        isToday && !isSelected && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );

  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Pressable
          onPress={() => listRef.current?.scrollToIndex({ index: todayIndex, animated: true })}
          hitSlop={8}
          style={styles.headerButton}
        >
          <Ionicons name="calendar-outline" size={20} color={COLORS.ink} />
        </Pressable>
      </View>

      <View style={styles.weekdays}>
        {WEEKDAY_SHORT.map((label, index) => (
          <View key={index} style={{ width: cellWidth }}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={months}
        keyExtractor={(m) => String(m.startMs)}
        renderItem={({ item }) => renderMonth(item)}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E6EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekdayText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 32,
  },
  scroll: {
    flex: 1,
  },
  monthTitle: {
    height: HEADING_HEIGHT,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rangeRow: {
    backgroundColor: '#EEF3FE',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dayTextDisabled: {
    color: COLORS.faint,
  },
  dayTextToday: {
    fontWeight: '800',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
