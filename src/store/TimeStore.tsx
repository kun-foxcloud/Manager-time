import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Kind,
  TimeEntry,
  User,
  USERS,
  WORK_TYPES,
  taskById,
  userById,
} from '../data/catalog';
import { startOfDay } from '../utils/time';

const ENTRIES_KEY = 'tm-entries';
const USER_KEY = 'tm-user';
const SETTINGS_KEY = 'tm-settings';

const KNOWN_USER_IDS = new Set(USERS.map((u) => u.id));
const KNOWN_KINDS = new Set(WORK_TYPES.map((t) => t.kind));

export type PaymentSettings = {
  usdToVnd: number;
  usdToVndAuto: boolean;
  hourlyRates: Record<string, number>;
  chargeRate: number;
};

const DEFAULT_SETTINGS: PaymentSettings = {
  usdToVnd: 25400,
  usdToVndAuto: true,
  hourlyRates: {},
  chargeRate: 0,
};

const RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

async function fetchUsdVndRate(): Promise<number | null> {
  try {
    const res = await fetch(RATE_API_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: { VND?: unknown } };
    const rate = data.rates?.VND;
    return typeof rate === 'number' && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

type AddEntryInput = {
  userId: string;
  taskId: string;
  durationMs: number;
  kind: Kind;
  dayMs: number;
};

type TimeContextValue = {
  user: User | null;
  entries: TimeEntry[];
  hydrated: boolean;
  settings: PaymentSettings;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  addEntry: (input: AddEntryInput) => void;
  updateEntry: (id: string, change: { dayMs: number; kind: Kind }) => void;
  removeEntry: (id: string) => void;
  setUsdToVnd: (rate: number) => void;
  setHourlyRate: (userId: string, usdPerHour: number) => void;
  setChargeRate: (usdPerHour: number) => void;
};

const TimeContext = createContext<TimeContextValue | null>(null);

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([ENTRIES_KEY, USER_KEY, SETTINGS_KEY])
      .then((pairs) => {
        const stored = Object.fromEntries(pairs) as Record<string, string | null>;
        if (stored[ENTRIES_KEY]) {
          try {
            const parsed: unknown = JSON.parse(stored[ENTRIES_KEY]);
            if (Array.isArray(parsed)) {
              setEntries(
                (parsed as TimeEntry[]).filter(
                  (e) => KNOWN_USER_IDS.has(e.userId) && KNOWN_KINDS.has(e.kind),
                ),
              );
            }
          } catch {
            setEntries([]);
          }
        }
        if (stored[USER_KEY]) setUser(userById(stored[USER_KEY]));
        if (stored[SETTINGS_KEY]) {
          try {
            const parsed: unknown = JSON.parse(stored[SETTINGS_KEY]);
            if (parsed && typeof parsed === 'object') {
              const s = parsed as Partial<PaymentSettings>;
              setSettings({
                usdToVnd:
                  typeof s.usdToVnd === 'number'
                    ? Math.trunc(s.usdToVnd)
                    : DEFAULT_SETTINGS.usdToVnd,
                usdToVndAuto: s.usdToVndAuto !== false,
                hourlyRates:
                  s.hourlyRates && typeof s.hourlyRates === 'object'
                    ? s.hourlyRates
                    : DEFAULT_SETTINGS.hourlyRates,
                chargeRate:
                  typeof s.chargeRate === 'number'
                    ? s.chargeRate
                    : DEFAULT_SETTINGS.chargeRate,
              });
            }
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !settings.usdToVndAuto) return;
    fetchUsdVndRate().then((rate) => {
      if (rate === null) return;
      setSettings((prev) =>
        prev.usdToVndAuto ? { ...prev, usdToVnd: Math.trunc(rate) } : prev,
      );
    });
  }, [hydrated, settings.usdToVndAuto]);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries, hydrated]);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(USER_KEY, user?.id ?? '');
  }, [user, hydrated]);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  const login = useCallback((email: string, password: string): string | null => {
    const matched = USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    );
    if (!matched) return 'Invalid email or password.';
    setUser(matched);
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const addEntry = useCallback(
    (input: AddEntryInput) => {
      if (!user || input.durationMs <= 0) return;
      const task = taskById(input.taskId);
      const entry: TimeEntry = {
        id: `entry-${Date.now()}-${entries.length}`,
        userId: input.userId,
        projectId: task.projectId,
        taskId: task.id,
        dayMs: startOfDay(input.dayMs),
        durationMs: input.durationMs,
        kind: input.kind,
      };
      setEntries((prev) => [...prev, entry]);
    },
    [user, entries.length],
  );

  const updateEntry = useCallback((id: string, change: { dayMs: number; kind: Kind }) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, dayMs: startOfDay(change.dayMs), kind: change.kind } : e,
      ),
    );
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setUsdToVnd = useCallback((rate: number) => {
    setSettings((prev) => ({ ...prev, usdToVnd: Math.trunc(rate), usdToVndAuto: false }));
  }, []);

  const setHourlyRate = useCallback((userId: string, usdPerHour: number) => {
    setSettings((prev) => ({
      ...prev,
      hourlyRates: { ...prev.hourlyRates, [userId]: usdPerHour },
    }));
  }, []);

  const setChargeRate = useCallback((usdPerHour: number) => {
    setSettings((prev) => ({ ...prev, chargeRate: usdPerHour }));
  }, []);

  const value = useMemo<TimeContextValue>(
    () => ({
      user,
      entries,
      hydrated,
      settings,
      login,
      logout,
      addEntry,
      updateEntry,
      removeEntry,
      setUsdToVnd,
      setHourlyRate,
      setChargeRate,
    }),
    [
      user,
      entries,
      hydrated,
      settings,
      login,
      logout,
      addEntry,
      updateEntry,
      removeEntry,
      setUsdToVnd,
      setHourlyRate,
      setChargeRate,
    ],
  );

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
}

export function useTime(): TimeContextValue {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error('useTime must be used inside TimeProvider');
  return ctx;
}
