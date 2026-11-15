import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DonutChart } from '../components/DonutChart';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { BarBucket, StackedBarChart } from '../components/StackedBarChart';
import { PROJECTS, USERS } from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';
import {
  Period,
  bucketEndMs,
  bucketLabel,
  bucketStarts,
  formatDuration,
  periodRange,
  periodTitle,
  shiftAnchor,
} from '../utils/time';

const PERIOD_OPTIONS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export function ReportsScreen() {
  const { user, entries } = useTime();
  const [period, setPeriod] = useState<Period>('week');
  const [anchor, setAnchor] = useState(() => Date.now());
  const [filterUserIds, setFilterUserIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const isAdmin = user?.isAdmin === true;
  const loggedUserId = user?.id ?? null;
  const filterUsers = USERS.filter((u) => filterUserIds.includes(u.id));
  const singleFilterUser = filterUsers.length === 1 ? filterUsers[0] : null;

  const range = periodRange(period, anchor);

  const report = useMemo(() => {
    const periodEntries = entries.filter(
      (e) =>
        e.dayMs >= range.startMs &&
        e.dayMs < range.endMs &&
        (isAdmin
          ? filterUserIds.length === 0 || filterUserIds.includes(e.userId)
          : e.userId === loggedUserId),
    );
    const totalMs = periodEntries.reduce((acc, e) => acc + e.durationMs, 0);

    const byProject = PROJECTS.map((project) => ({
      project,
      ms: periodEntries
        .filter((e) => e.projectId === project.id)
        .reduce((acc, e) => acc + e.durationMs, 0),
    }))
      .filter((x) => x.ms > 0)
      .sort((a, b) => b.ms - a.ms);

    const buckets: BarBucket[] = bucketStarts(period, range).map((startMs) => ({
      key: String(startMs),
      label: bucketLabel(period, startMs),
      segments: byProject.map(({ project }) => ({
        color: project.color,
        valueMs: periodEntries
          .filter(
            (e) =>
              e.projectId === project.id &&
              e.dayMs >= startMs &&
              e.dayMs < Math.min(bucketEndMs(period, startMs), range.endMs),
          )
          .reduce((acc, e) => acc + e.durationMs, 0),
      })),
    }));

    const maxBucketMs = Math.max(
      0,
      ...buckets.map((b) => b.segments.reduce((acc, s) => acc + s.valueMs, 0)),
    );
    const maxHours =
      period === 'week' ? 24 : Math.max(4, Math.ceil(maxBucketMs / 3_600_000 / 4) * 4);

    return { totalMs, byProject, buckets, maxHours };
  }, [entries, period, range, isAdmin, filterUserIds, loggedUserId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Reports" />
        <View style={styles.periodRow}>
          <SegmentedTabs options={PERIOD_OPTIONS} active={period} onChange={(k) => setPeriod(k as Period)} />
        </View>

        <View style={styles.rangePill}>
          <Pressable onPress={() => setAnchor((a) => shiftAnchor(period, a, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.rangeText}>{periodTitle(period, anchor)}</Text>
          <Pressable onPress={() => setAnchor((a) => shiftAnchor(period, a, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </Pressable>
        </View>

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
                  style={[styles.filterOption, filterUsers.length === 0 && styles.filterOptionSelected]}
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

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Tracker hours</Text>
            </View>
            <Text style={styles.totalValue}>{formatDuration(report.totalMs)}</Text>

            {report.byProject.map(({ project, ms }) => (
              <View key={project.id} style={styles.projectRow}>
                <View style={[styles.projectChip, { backgroundColor: project.color }]} />
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectTime}>{formatDuration(ms)}</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.faint} />
              </View>
            ))}

            <View style={styles.chartWrap}>
              <StackedBarChart buckets={report.buckets} maxHours={report.maxHours} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Grouped by project</Text>
              <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.muted} />
            </View>
            <View style={styles.donutWrap}>
              <DonutChart
                segments={report.byProject.map(({ project, ms }) => ({
                  color: project.color,
                  valueMs: ms,
                }))}
                centerLabel="Total"
                centerValue={formatDuration(report.totalMs)}
              />
            </View>
            {report.byProject.map(({ project, ms }) => {
              const percent =
                report.totalMs > 0 ? Math.round((ms / report.totalMs) * 100) : 0;
              return (
                <View key={project.id} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: project.color }]} />
                  <Text style={styles.legendName}>{project.name}</Text>
                  <Text style={styles.legendTime}>{formatDuration(ms)}</Text>
                  <Text style={styles.legendPercent}>{percent}%</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </SafeAreaView>
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
  periodRow: {
    marginTop: 16,
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF1F9',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 12,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
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
  scroll: {
    flex: 1,
    marginTop: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    ...SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  totalValue: {
    marginTop: 10,
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.ink,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  projectChip: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  projectName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  projectTime: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginRight: 8,
  },
  chartWrap: {
    marginTop: 16,
    marginLeft: -6,
  },
  donutWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  legendTime: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginRight: 12,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    width: 38,
    textAlign: 'right',
  },
  bottomPad: {
    height: 24,
  },
});
