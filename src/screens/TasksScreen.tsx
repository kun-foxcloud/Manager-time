import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarStack } from '../components/AvatarStack';
import { CalendarPicker } from '../components/CalendarPicker';
import { DateStrip } from '../components/DateStrip';
import { EditEntryModal } from '../components/EditEntryModal';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  TimeEntry,
  USERS,
  User,
  projectById,
  userById,
  workTypeById,
} from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';
import {
  addMonths,
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
  const { user, entries, updateEntry, removeEntry } = useTime();
  const now = useNow(30_000);
  const [range, setRange] = useState(() => {
    const endMs = startOfDay(Date.now());
    return { startMs: addMonths(endMs, -1), endMs };
  });
  const [selectedDayMs, setSelectedDayMs] = useState(() => startOfDay(Date.now()));
  const [filterUserIds, setFilterUserIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const trashRef = useRef<React.ComponentRef<typeof View>>(null);
  const trashRectRef = useRef<TrashRect | null>(null);

  const isAdmin = user?.isAdmin === true;
  const filterUsers = USERS.filter((u) => filterUserIds.includes(u.id));
  const singleFilterUser = filterUsers.length === 1 ? filterUsers[0] : null;
  const loggedUserId = user?.id ?? null;
  const editingEntry = entries.find((e) => e.id === editingEntryId) ?? null;

  const dayStart = startOfDay(selectedDayMs);
  const dayEntries = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.dayMs === dayStart &&
          e.durationMs > 0 &&
          (isAdmin
            ? filterUserIds.length === 0 || filterUserIds.includes(e.userId)
            : e.userId === loggedUserId),
      ),
    [entries, dayStart, isAdmin, filterUserIds, loggedUserId],
  );

  const teammatesOnProject = (projectId: string): User[] => {
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
        <ScreenHeader
          title="Task Management"
          right={
            <Pressable onPress={() => setCalendarOpen(true)} style={styles.calendarButton}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.ink} />
            </Pressable>
          }
        />
        <DateStrip
          startDayMs={range.startMs}
          endDayMs={range.endMs}
          selectedDayMs={selectedDayMs}
          onSelect={setSelectedDayMs}
        />

        {isAdmin && (
          <View style={styles.filterWrap}>
            <Pressable
              onPress={() => setFilterOpen((open) => !open)}
              style={[styles.filterTrigger, filterOpen && styles.filterTriggerOpen]}
            >
              <View
                style={[
                  styles.filterAvatar,
                  { backgroundColor: singleFilterUser?.color ?? COLORS.primary },
                ]}
              >
                {singleFilterUser ? (
                  <Text style={styles.filterAvatarText}>{singleFilterUser.initials}</Text>
                ) : (
                  <Ionicons name="people" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.filterLabel} numberOfLines={1}>
                {filterUsers.length > 0
                  ? filterUsers.map((u) => u.name).join(', ')
                  : 'All users'}
              </Text>
              <Ionicons
                name={filterOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.muted}
              />
            </Pressable>

            {filterOpen && (
              <View style={styles.filterMenu}>
                <Pressable
                  onPress={() => setFilterUserIds([])}
                  style={[
                    styles.filterOption,
                    filterUsers.length === 0 && styles.filterOptionSelected,
                  ]}
                >
                  <View style={[styles.filterAvatar, styles.filterOptionAvatar]}>
                    <Ionicons name="people" size={14} color={COLORS.primary} />
                  </View>
                  <View style={styles.filterOptionMeta}>
                    <Text style={styles.filterOptionName}>All users</Text>
                  </View>
                  {filterUsers.length === 0 && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </Pressable>
                {USERS.map((person) => {
                  const selected = filterUserIds.includes(person.id);
                  return (
                    <Pressable
                      key={person.id}
                      onPress={() =>
                        setFilterUserIds((ids) =>
                          ids.includes(person.id)
                            ? ids.filter((id) => id !== person.id)
                            : [...ids, person.id],
                        )
                      }
                      style={[styles.filterOption, selected && styles.filterOptionSelected]}
                    >
                      <View
                        style={[
                          styles.filterAvatar,
                          styles.filterOptionAvatar,
                          { backgroundColor: person.color },
                        ]}
                      >
                        <Text style={styles.filterAvatarText}>{person.initials}</Text>
                      </View>
                      <View style={styles.filterOptionMeta}>
                        <Text style={styles.filterOptionName}>{person.name}</Text>
                        <Text style={styles.filterOptionRole}>{person.role}</Text>
                      </View>
                      {selected && (
                        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

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
                teammates={teammatesOnProject(entry.projectId)}
                now={now}
                isOverTrash={isOverTrash}
                onDrop={handleDrop}
                onEdit={() => setEditingEntryId(entry.id)}
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

      {calendarOpen && (
        <CalendarPicker
          mode="range"
          rangeStartMs={range.startMs}
          rangeEndMs={range.endMs}
          onSelectRange={(startMs, endMs) => {
            setRange({ startMs, endMs });
            setSelectedDayMs((prev) => (prev < startMs || prev > endMs ? endMs : prev));
            setCalendarOpen(false);
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={(change) => {
            updateEntry(editingEntry.id, change);
            setEditingEntryId(null);
          }}
          onClose={() => setEditingEntryId(null)}
        />
      )}
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
  onEdit,
  isOverTrash,
}: {
  entry: TimeEntry;
  teammates: User[];
  now: number;
  onDragStateChange: (active: boolean) => void;
  onHoverTrash: (over: boolean) => void;
  onDrop: (entryId: string, pageX: number, pageY: number) => void;
  onEdit: () => void;
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
    <View style={styles.entryWrap}>
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
            <Ionicons name="time" size={12} color="#FFFFFF" />
            <Text style={styles.entryDuration}>{formatHoursMinutes(entry.durationMs)}</Text>
          </View>
        </View>
        <Text style={styles.entryTitle} numberOfLines={2}>
          {formatRelativeDay(entry.dayMs, now)}
        </Text>
        <View style={styles.entryFooter}>
          <AvatarStack users={teammates} size={18} />
          <Text style={styles.entryOwner}>{owner.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: workType.color }]}>
            <Text style={styles.typeBadgeText}>{workType.label}</Text>
          </View>
        </View>
      </Animated.View>
      {!lifting && (
        <Pressable onPress={onEdit} hitSlop={6} style={styles.entryEditButton}>
          <Ionicons name="pencil" size={12} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
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
  calendarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E6EAF3',
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterWrap: {
    marginTop: 12,
    position: 'relative',
    zIndex: 20,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterTriggerOpen: {
    borderColor: '#D8E2FB',
  },
  filterAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  filterMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6EBF7',
    padding: 6,
    gap: 4,
    zIndex: 30,
    ...SHADOW,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#F0F4FE',
  },
  filterOptionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF3FE',
  },
  filterOptionMeta: {
    flex: 1,
    marginLeft: 10,
  },
  filterOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  filterOptionRole: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
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
  entryWrap: {
    position: 'relative',
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
    paddingRight: 30,
  },
  entryEditButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  entryDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
