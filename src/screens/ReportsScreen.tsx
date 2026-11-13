import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DonutChart } from '../components/DonutChart';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { BarBucket, StackedBarChart } from '../components/StackedBarChart';
import { PROJECTS } from '../data/catalog';
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
  const { entries } = useTime();
  const [period, setPeriod] = useState<Period>('week');
  const [anchor, setAnchor] = useState(() => Date.now());

  const range = periodRange(period, anchor);

  const report = useMemo(() => {
    const periodEntries = entries.filter(
      (e) => e.dayMs >= range.startMs && e.dayMs < range.endMs,
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
  }, [entries, period, range]);

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
