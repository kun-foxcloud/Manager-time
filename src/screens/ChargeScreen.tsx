import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { USERS } from '../data/catalog';
import { useTime } from '../store/TimeStore';
import { COLORS, SHADOW } from '../theme';
import { MS, periodRange, periodTitle, shiftAnchor } from '../utils/time';

const formatMoney = (n: number) => Math.round(n).toLocaleString('en-US');

const DUTY_RATE = 0.1;

export function ChargeScreen() {
  const { user, entries, settings, setChargeRate } = useTime();
  const [anchor, setAnchor] = useState(() => Date.now());
  const [rateDraft, setRateDraft] = useState<string | null>(null);

  const isAdmin = user?.isAdmin === true;
  const rate = settings.chargeRate;
  const range = periodRange('month', anchor);
  const monthEntries = entries.filter(
    (e) => e.dayMs >= range.startMs && e.dayMs < range.endMs,
  );

  if (!isAdmin) return <Redirect href="/payment" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Charge" />

        <View style={styles.rangePill}>
          <Pressable onPress={() => setAnchor((a) => shiftAnchor('month', a, -1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.rangeText}>{periodTitle('month', anchor)}</Text>
          <Pressable onPress={() => setAnchor((a) => shiftAnchor('month', a, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Working Rate</Text>
              <Ionicons name="cash-outline" size={18} color={COLORS.muted} />
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.lineLabel}>Rate for all accounts</Text>
              <TextInput
                style={styles.rateInput}
                value={rateDraft ?? String(rate)}
                onChangeText={(t) => {
                  setRateDraft(t);
                  setChargeRate(parseFloat(t.replace(',', '.')) || 0);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.rateSuffix}>$/hr</Text>
            </View>
          </View>

          {USERS.map((person) => {
            const ms = monthEntries
              .filter((e) => e.userId === person.id)
              .reduce((acc, e) => acc + e.durationMs, 0);
            const hours = Math.round(ms / MS.HOUR);
            const gross = hours * rate;
            const duty = Math.round(gross * DUTY_RATE);
            const total = Math.round(gross) - duty;
            return (
              <View key={person.id} style={styles.card}>
                <View style={styles.accountRow}>
                  <View style={[styles.avatar, { backgroundColor: person.color }]}>
                    <Text style={styles.avatarText}>{person.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.accountName}>{person.name}</Text>
                    <Text style={styles.accountRole}>{person.role}</Text>
                  </View>
                </View>

                <View style={styles.line}>
                  <Text style={styles.lineLabel}>Working Rate</Text>
                  <Text style={styles.lineValue}>{rate.toLocaleString('en-US')}$/hr</Text>
                </View>
                <View style={styles.line}>
                  <Text style={styles.lineLabel}>Working Hour</Text>
                  <Text style={styles.lineValue}>{hours}h</Text>
                </View>
                <View style={styles.line}>
                  <Text style={styles.lineLabel}>Duty</Text>
                  <Text style={styles.lineValue}>{formatMoney(duty)}$</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatMoney(total)}$</Text>
                </View>
              </View>
            );
          })}
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  accountRole: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  lineLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  lineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  rateInput: {
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
  rateSuffix: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    width: 32,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bottomPad: {
    height: 24,
  },
});
