import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarStack } from '../components/AvatarStack';
import { ScreenHeader } from '../components/ScreenHeader';
import { WeekStrip } from '../components/WeekStrip';
import { TimeEntry, User, projectById, userById, workTypeById } from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';
import {
  formatClock,
  formatDayHeading,
  formatHoursMinutes,
  formatRelativeDay,
  startOfDay,
} from '../utils/time';
import { useNow } from '../utils/useNow';

type TrashRect = { x: number; y: number; width: number; height: number };

const LONG_PRESS_MS = 180;

export function TasksScreen() {
  const { entries, removeEntry } = useTime();
  const now = useNow(30_000);
  const [selectedDayMs, setSelectedDayMs] = useState(() => startOfDay(Date.now()));
  const [dragActive, setDragActive] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const trashRef = useRef<React.ComponentRef<typeof View>>(null);
  const trashRectRef = useRef<TrashRect | null>(null);

  const dayStart = startOfDay(selectedDayMs);
  const dayEntries = useMemo(
    () => entries.filter((e) => e.dayMs === dayStart && e.durationMs > 0),
    [entries, dayStart],
  );

  const usersOnProjectToday = (projectId: string): User[] => {
    const ids = new Set(dayEntries.filter((e) => e.projectId === projectId).map((e) => e.userId));
    return [...ids].map(userById);
  };

  const measureTrash = useCallback(() => {
    trashRef.current?.measureInWindow((x, y, width, height) => {
      trashRectRef.current = { x, y, width, height };
    });
  }, []);

  const isOverTrash = useCallback((pageX: number, pageY: number) => {
    const rect = trashRectRef.current;
    if (!rect) return false;
    const pad = 16;
    return (
      pageX >= rect.x - pad &&
      pageX <= rect.x + rect.width + pad &&
      pageY >= rect.y - pad &&
      pageY <= rect.y + rect.height + pad
    );
  }, []);

  const handleDrop = useCallback(
    (entryId: string, pageX: number, pageY: number) => {
      if (isOverTrash(pageX, pageY)) removeEntry(entryId);
    },
    [isOverTrash, removeEntry],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Task Management" />
        <WeekStrip selectedDayMs={selectedDayMs} onSelect={setSelectedDayMs} />

        <View style={styles.dayRow}>
          <Text style={styles.dayHeading}>{formatDayHeading(selectedDayMs)}</Text>
          <Text style={styles.nowClock}>{formatClock(now)}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dragActive}
        >
          {dayEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={30} color={COLORS.faint} />
              <Text style={styles.emptyText}>No time logged for this day</Text>
            </View>
          ) : (
            dayEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                teammates={usersOnProjectToday(entry.projectId)}
                now={now}
                isOverTrash={isOverTrash}
                onDrop={handleDrop}
                onHoverTrash={setOverTrash}
                onDragStateChange={setDragActive}
              />
            ))
          )}
          <View style={styles.bottomPad} />
        </ScrollView>

        {dragActive && (
          <View
            ref={trashRef}
            onLayout={measureTrash}
            style={styles.trashZone}
            pointerEvents="none"
          >
            <View style={[styles.trashPill, overTrash && styles.trashPillActive]}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={overTrash ? '#FFFFFF' : COLORS.danger}
              />
              <Text style={[styles.trashLabel, overTrash && styles.trashLabelActive]}>
                Drag here to delete
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function EntryCard({
  entry,
  teammates,
  now,
  onDragStateChange,
  onHoverTrash,
  onDrop,
  isOverTrash,
}: {
  entry: TimeEntry;
  teammates: User[];
  now: number;
  onDragStateChange: (active: boolean) => void;
  onHoverTrash: (over: boolean) => void;
  onDrop: (entryId: string, pageX: number, pageY: number) => void;
  isOverTrash: (pageX: number, pageY: number) => boolean;
}) {
  const project = projectById(entry.projectId);
  const owner = userById(entry.userId);
  const workType = workTypeById(entry.kind);

  const [pan] = useState(() => new Animated.ValueXY());
  const [lifting, setLifting] = useState(false);

  const [responder] = useState(() => {
    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let active = false;
    const clearTimer = () => {
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
    };
    const settle = () => {
      clearTimer();
      active = false;
      setLifting(false);
      onDragStateChange(false);
      onHoverTrash(false);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        clearTimer();
        pressTimer = setTimeout(() => {
          active = true;
          setLifting(true);
          onDragStateChange(true);
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (_, g) => {
        if (!active) return;
        pan.setValue({ x: g.dx, y: g.dy });
        onHoverTrash(isOverTrash(g.moveX, g.moveY));
      },
      onPanResponderRelease: (_, g) => {
        const droppedOnTrash = active && isOverTrash(g.moveX, g.moveY);
        settle();
        if (droppedOnTrash) {
          onDrop(entry.id, g.moveX, g.moveY);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        settle();
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
      onPanResponderTerminationRequest: () => !active,
    });
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.entryCard,
        { backgroundColor: project.color },
        lifting && styles.entryCardLifting,
        { transform: pan.getTranslateTransform() },
      ]}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.entryProject}>{project.name}</Text>
        <View style={styles.entryDurationRow}>
          <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.95)" />
          <Text style={styles.entryDuration}>{formatHoursMinutes(entry.durationMs)}</Text>
        </View>
      </View>
      <Text style={styles.entryTitle} numberOfLines={2}>
        {formatRelativeDay(entry.dayMs, now)}
      </Text>
      <View style={styles.entryFooter}>
        <AvatarStack users={teammates} size={18} />
        <Text style={styles.entryOwner}>{owner.name}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{workType.label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  dayHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  nowClock: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  scroll: {
    flex: 1,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.muted,
  },
  entryCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  entryCardLifting: {
    zIndex: 20,
    elevation: 12,
    shadowColor: '#1F2340',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    opacity: 0.97,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryProject: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  entryDuration: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  entryTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  entryOwner: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  typeBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trashZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
  },
  trashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 112, 138, 0.45)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    ...SHADOW,
  },
  trashPillActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
    transform: [{ scale: 1.08 }],
  },
  trashLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  trashLabelActive: {
    color: '#FFFFFF',
  },
  bottomPad: {
    height: 96,
  },
});
