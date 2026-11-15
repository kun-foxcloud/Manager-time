import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { ScreenHeader } from '../components/ScreenHeader';
import { User, USERS } from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';
import { MS, formatHoursMinutes, periodRange, periodTitle, shiftAnchor } from '../utils/time';

const formatUsd = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatVndNumber = (n: number) => Math.trunc(n).toLocaleString('en-US');

const formatVnd = (n: number) => `₫${formatVndNumber(n)}`;

export function PaymentScreen() {
  const { user, entries, settings, setUsdToVnd, setHourlyRate } = useTime();
  const [anchor, setAnchor] = useState(() => Date.now());
  const [rateDraft, setRateDraft] = useState<string | null>(null);
  const [hourlyDrafts, setHourlyDrafts] = useState<Record<string, string>>({});
  const [filterUserIds, setFilterUserIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportPhase, setExportPhase] = useState<'idle' | 'capturing' | 'saving'>('idle');
  const exportRef = useRef<React.ComponentRef<typeof View>>(null);

  const range = periodRange('month', anchor);
  const monthEntries = entries.filter(
    (e) => e.dayMs >= range.startMs && e.dayMs < range.endMs,
  );

  const usdToVnd = settings.usdToVnd;
  const isAdmin = user?.isAdmin === true;
  const filterUsers = USERS.filter((u) => filterUserIds.includes(u.id));
  const singleFilterUser = filterUsers.length === 1 ? filterUsers[0] : null;
  const reportUsers: User[] = isAdmin ? USERS : user ? [user] : [];

  const allRows = reportUsers.map((person) => {
    const ms = monthEntries
      .filter((e) => e.userId === person.id)
      .reduce((acc, e) => acc + e.durationMs, 0);
    const hourly = settings.hourlyRates[person.id] ?? 0;
    const usd = (ms / MS.HOUR) * hourly;
    return { person, ms, hourly, usd, vnd: usd * usdToVnd };
  });

  const rows =
    isAdmin && filterUserIds.length > 0
      ? allRows.filter((r) => filterUserIds.includes(r.person.id))
      : allRows;

  const totalUsd = rows.reduce((acc, r) => acc + r.usd, 0);
  const totalVnd = rows.reduce((acc, r) => acc + r.vnd, 0);

  async function exportInvoiceImage() {
    if (exportPhase !== 'idle') return;
    setExportPhase('capturing');
    try {
      if (Platform.OS === 'web') {
        const dataUri = await captureRef(exportRef, { format: 'png', result: 'data-uri' });
        const month = new Date(anchor);
        const stamp = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `invoice-${stamp}.png`;
        link.click();
        return;
      }
      const imageUri = await captureRef(exportRef, { format: 'png', result: 'tmpfile' });
      setExportPhase('saving');
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      if (permission.status !== 'granted') {
        Alert.alert('Photos access needed', 'Allow photo access to save the invoice image.');
        return;
      }
      await MediaLibrary.Asset.create(imageUri);
      Alert.alert('Saved', 'Invoice image saved to Photos.');
    } catch {
      Alert.alert('Export failed', 'Could not save the invoice image.');
    } finally {
      setExportPhase('idle');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Payment" />

        <View style={styles.rangePill}>
          <Pressable onPress={() => setAnchor((a) => shiftAnchor('month', a, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.rangeText}>{periodTitle('month', anchor)}</Text>
          <Pressable onPress={() => setAnchor((a) => shiftAnchor('month', a, 1))} hitSlop={10}>
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

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View ref={exportRef} collapsable={false} style={styles.exportBlock}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total ({periodTitle('month', anchor)})</Text>
              <Text style={styles.totalVnd}>{formatVnd(totalVnd)}</Text>
              <Text style={styles.totalUsd}>{formatUsd(totalUsd)}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Invoice</Text>
                <Pressable
                  onPress={exportInvoiceImage}
                  disabled={exportPhase !== 'idle'}
                  hitSlop={8}
                  style={styles.exportButton}
                >
                  {exportPhase === 'saving' ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={16} color={COLORS.primary} />
                  )}
                  <Text style={styles.exportLabel}>
                    {exportPhase === 'saving' ? 'Saving' : 'Export'}
                  </Text>
                </Pressable>
              </View>
              {rows.map(({ person, ms, hourly, usd, vnd }) => (
                <View key={person.id} style={styles.personRow}>
                  <View style={[styles.personDot, { backgroundColor: person.color }]} />
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{person.name}</Text>
                    <Text style={styles.personHours}>
                      {formatHoursMinutes(ms)} · {formatUsd(hourly)}/h
                    </Text>
                  </View>
                  <View style={styles.personAmounts}>
                    <Text style={styles.personVnd}>{formatVnd(vnd)}</Text>
                    <Text style={styles.personUsd}>{formatUsd(usd)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Config</Text>
              <Ionicons name="settings-outline" size={18} color={COLORS.muted} />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>1 USD =</Text>
              {isAdmin ? (
                <TextInput
                  style={styles.settingInput}
                  value={rateDraft ?? formatVndNumber(settings.usdToVnd)}
                  onChangeText={(t) => {
                    const digits = t.split('.')[0].replace(/[^0-9]/g, '');
                    const next = parseInt(digits || '0', 10);
                    setRateDraft(digits ? formatVndNumber(next) : '');
                    setUsdToVnd(next);
                  }}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.settingValue}>{formatVndNumber(settings.usdToVnd)}</Text>
              )}
              <Text style={styles.settingSuffix}>VND</Text>
            </View>

            <Text style={styles.settingSectionTitle}>Rate / hour (USD)</Text>
            {allRows.map(({ person, hourly }) => (
              <View key={person.id} style={styles.settingRow}>
                <View style={[styles.personDot, { backgroundColor: person.color }]} />
                <Text style={styles.settingLabel}>{person.name}</Text>
                {isAdmin ? (
                  <TextInput
                    style={styles.settingInput}
                    value={hourlyDrafts[person.id] ?? String(hourly)}
                    onChangeText={(t) => {
                      setHourlyDrafts((prev) => ({ ...prev, [person.id]: t }));
                      setHourlyRate(person.id, parseFloat(t.replace(',', '.')) || 0);
                    }}
                    keyboardType="decimal-pad"
                  />
                ) : (
                  <Text style={styles.settingValue}>{formatUsd(hourly)}</Text>
                )}
                <Text style={styles.settingSuffix}>$/h</Text>
              </View>
            ))}
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
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF1F9',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 16,
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
  exportBlock: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: -16,
    marginVertical: -16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF3FE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  exportLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    ...SHADOW,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  totalVnd: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  totalUsd: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
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
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  personDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  personHours: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  personAmounts: {
    alignItems: 'flex-end',
  },
  personVnd: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  personUsd: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  settingSectionTitle: {
    marginTop: 18,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  settingInput: {
    minWidth: 84,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'right',
    backgroundColor: COLORS.background,
  },
  settingValue: {
    minWidth: 84,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'right',
  },
  settingSuffix: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    width: 32,
  },
  bottomPad: {
    height: 24,
  },
});
