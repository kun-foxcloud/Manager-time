import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarStack } from '../components/AvatarStack';
import { CalendarPicker } from '../components/CalendarPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import {
  DAILY_TARGET_MS,
  Kind,
  TASKS,
  TimeEntry,
  User,
  WORK_TYPES,
  projectById,
  taskById,
  userById,
  workTypeById,
} from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';
import {
  MS,
  formatDuration,
  formatHoursMinutes,
  formatRelativeDay,
  startOfDay,
} from '../utils/time';
import { useNow } from '../utils/useNow';

type TimerTab = 'add' | 'list';

const TAB_OPTIONS = [
  { key: 'add', label: 'Add time' },
  { key: 'list', label: 'List view' },
];

function Stepper({
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        hitSlop={8}
        style={styles.stepperButton}
      >
        <Ionicons name="remove" size={16} color={COLORS.primary} />
      </Pressable>
      <View style={styles.stepperValueWrap}>
        <Text style={styles.stepperValue}>
          {value}
          <Text style={styles.stepperSuffix}> {suffix}</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        hitSlop={8}
        style={styles.stepperButton}
      >
        <Ionicons name="add" size={16} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

export function TimerScreen() {
  const { user, entries, addEntry } = useTime();
  const now = useNow();
  const userId = user?.id ?? '';
  const [tab, setTab] = useState<TimerTab>('add');
  const [activeTaskId, setActiveTaskId] = useState(TASKS[0].id);
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(0);
  const [selectedDayMs, setSelectedDayMs] = useState(() => startOfDay(Date.now()));
  const [workType, setWorkType] = useState<Kind>('work1');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dayStart = startOfDay(selectedDayMs);
  const myEntries = entries.filter((e) => e.userId === userId && e.dayMs === dayStart);
  const allEntriesToday = entries.filter((e) => e.dayMs === dayStart);

  const todayWorkMs = myEntries.reduce((acc, e) => acc + e.durationMs, 0);
  const progress = Math.min(1, todayWorkMs / DAILY_TARGET_MS);
  const percentLabel = todayWorkMs > 0 ? `${Math.max(1, Math.round(progress * 100))}%` : '0%';

  const draftMs = hours * MS.HOUR + minutes * MS.MINUTE;
  const activeWorkType = workTypeById(workType);

  const usersOnProjectToday = (projectId: string): User[] => {
    const ids = new Set(
      allEntriesToday.filter((e) => e.projectId === projectId).map((e) => e.userId),
    );
    return [...ids].map(userById);
  };

  const addTime = () => {
    addEntry({
      userId,
      taskId: activeTaskId,
      durationMs: draftMs,
      kind: workType,
      dayMs: dayStart,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Timer" />
        <View style={styles.tabsRow}>
          <SegmentedTabs options={TAB_OPTIONS} active={tab} onChange={(k) => setTab(k as TimerTab)} />
        </View>

        <View style={styles.selectRow}>
          <View style={styles.selectWrap}>
            <Pressable onPress={() => setCalendarOpen(true)} style={styles.selectBox}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
              <Text style={styles.selectValue} numberOfLines={1}>
                {formatRelativeDay(dayStart, now)}
              </Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.muted} />
            </Pressable>
          </View>

          <View style={styles.selectWrap}>
            <Pressable onPress={() => setTypeMenuOpen((open) => !open)} style={styles.selectBox}>
              <View style={[styles.typeAvatar, { backgroundColor: activeWorkType.color }]}>
                <Text style={styles.typeAvatarText}>{activeWorkType.label.charAt(0)}</Text>
              </View>
              <Text style={styles.selectValue} numberOfLines={1}>
                {activeWorkType.label}
              </Text>
              <Ionicons
                name={typeMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={COLORS.muted}
              />
            </Pressable>
            {typeMenuOpen && (
              <View style={styles.menuCard}>
                {WORK_TYPES.map((t) => {
                  const selected = t.kind === workType;
                  return (
                    <Pressable
                      key={t.kind}
                      onPress={() => {
                        setWorkType(t.kind);
                        setTypeMenuOpen(false);
                      }}
                      style={styles.menuOption}
                    >
                      <View style={[styles.typeAvatar, { backgroundColor: t.color }]}>
                        <Text style={styles.typeAvatarText}>{t.label.charAt(0)}</Text>
                      </View>
                      <Text
                        style={[
                          styles.menuOptionText,
                          selected && styles.menuOptionActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                      {selected && <Ionicons name="checkmark" size={14} color={COLORS.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {tab === 'list' ? (
          <SessionList entries={myEntries} />
        ) : (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <View style={styles.totalValues}>
                <Text style={styles.totalTime}>{formatDuration(todayWorkMs)}</Text>
                <View style={styles.percentPill}>
                  <Text style={styles.percentPillText}>{percentLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.addRow}>
              <Stepper value={hours} min={0} max={12} suffix="h" onChange={setHours} />
              <Stepper
                value={minutes}
                min={0}
                max={55}
                step={5}
                suffix="m"
                onChange={setMinutes}
              />
              <Pressable
                onPress={addTime}
                disabled={draftMs <= 0}
                style={[styles.addButton, draftMs <= 0 && styles.addButtonDisabled]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={styles.taskSectionHeader}>
          <Text style={styles.taskSectionTitle}>Task</Text>
          <View style={styles.taskIcons}>
            <Ionicons name="create-outline" size={18} color={COLORS.muted} />
            <Ionicons name="checkmark-done-outline" size={18} color={COLORS.muted} />
            <Ionicons name="copy-outline" size={18} color={COLORS.muted} />
            <Ionicons name="trash-outline" size={18} color={COLORS.muted} />
          </View>
        </View>

        <FlatList
          data={TASKS}
          keyExtractor={(t) => t.id}
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const project = projectById(item.projectId);
            const selected = item.id === activeTaskId;
            const users = usersOnProjectToday(project.id);
            return (
              <Pressable
                onPress={() => setActiveTaskId(item.id)}
                style={[styles.taskRow, selected && styles.taskRowSelected]}
              >
                <View style={[styles.tagChip, { backgroundColor: `${project.color}26` }]}>
                  <Text style={[styles.tagText, { color: project.color }]}>{project.tag}</Text>
                </View>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <AvatarStack users={users} size={22} />
                {users.length > 0 && (
                  <View style={styles.countBubble}>
                    <Text style={styles.countText}>{users.length}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {calendarOpen && (
        <CalendarPicker
          mode="single"
          selectedDayMs={dayStart}
          onSelect={(dayMs) => {
            setSelectedDayMs(dayMs);
            setCalendarOpen(false);
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

function SessionList({ entries }: { entries: TimeEntry[] }) {
  const now = useNow(30_000);
  const sorted = [...entries].reverse();
  if (sorted.length === 0) {
    return (
      <View style={styles.emptyList}>
        <Ionicons name="time-outline" size={30} color={COLORS.faint} />
        <Text style={styles.emptyText}>No time logged today yet</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={sorted}
      keyExtractor={(e) => e.id}
      style={styles.sessionList}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const project = projectById(item.projectId);
        const task = taskById(item.taskId);
        return (
          <View style={styles.sessionRow}>
            <View style={[styles.sessionDot, { backgroundColor: project.color }]} />
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionTitle} numberOfLines={1}>
                {formatRelativeDay(item.dayMs, now)}
              </Text>
              <Text style={styles.sessionTime}>
                {task.title} · {formatHoursMinutes(item.durationMs)} ·{' '}
                {workTypeById(item.kind).label}
              </Text>
            </View>
          </View>
        );
      }}
    />
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
  tabsRow: {
    marginTop: 18,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  totalValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalTime: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
  },
  percentPill: {
    backgroundColor: '#EEF2FD',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  percentPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  selectRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    zIndex: 10,
  },
  selectWrap: {
    flex: 1,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    ...SHADOW,
  },
  selectValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  typeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    ...SHADOW,
    zIndex: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
  },
  menuOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  menuOptionActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 6,
    ...SHADOW,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueWrap: {
    minWidth: 56,
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  stepperSuffix: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  taskSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  taskSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  taskIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  taskList: {
    flex: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    ...SHADOW,
  },
  taskRowSelected: {
    backgroundColor: '#EDF3FE',
  },
  tagChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    marginRight: 10,
  },
  countBubble: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sessionList: {
    flex: 1,
    marginTop: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    ...SHADOW,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sessionMeta: {
    flex: 1,
    marginRight: 10,
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  sessionTime: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.muted,
  },
  emptyList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.muted,
  },
});
