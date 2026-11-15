export const MS = {
  MINUTE: 60_000,
  HOUR: 3_600_000,
  DAY: 86_400_000,
} as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

export const WEEKDAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function addMonths(ms: number, months: number): number {
  const d = new Date(ms);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

export function startOfWeek(ms: number): number {
  const d = new Date(startOfDay(ms));
  return addDays(d.getTime(), -((d.getDay() + 6) % 7));
}

export function startOfMonth(ms: number): number {
  const d = new Date(ms);
  d.setDate(1);
  return startOfDay(d.getTime());
}

export function startOfYear(ms: number): number {
  const d = new Date(ms);
  d.setMonth(0, 1);
  return startOfDay(d.getTime());
}

export function isSameDay(aMs: number, bMs: number): boolean {
  return startOfDay(aMs) === startOfDay(bMs);
}

export function minutesOfDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatHourMinute(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours()}:${pad2(d.getMinutes())}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatDayHeading(ms: number): string {
  const d = new Date(ms);
  return `${WEEKDAY_LONG[d.getDay()]} ${d.getDate()} ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRelativeDay(ms: number, nowMs: number): string {
  const diffDays = Math.round((startOfDay(nowMs) - startOfDay(ms)) / MS.DAY);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const d = new Date(ms);
  return `${WEEKDAY_SHORT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export type Period = 'week' | 'month' | 'year';

export type Range = { startMs: number; endMs: number };

export function periodRange(period: Period, anchorMs: number): Range {
  if (period === 'week') {
    const startMs = startOfWeek(anchorMs);
    return { startMs, endMs: addDays(startMs, 7) };
  }
  if (period === 'month') {
    const startMs = startOfMonth(anchorMs);
    return { startMs, endMs: addMonths(startMs, 1) };
  }
  const startMs = startOfYear(anchorMs);
  return { startMs, endMs: addMonths(startMs, 12) };
}

export function shiftAnchor(period: Period, anchorMs: number, delta: number): number {
  if (period === 'week') return addDays(anchorMs, 7 * delta);
  if (period === 'month') return addMonths(anchorMs, delta);
  return addMonths(anchorMs, 12 * delta);
}

export function periodTitle(period: Period, anchorMs: number): string {
  const { startMs, endMs } = periodRange(period, anchorMs);
  const s = new Date(startMs);
  const e = new Date(addDays(endMs, -1));
  if (period === 'week') {
    return `${MONTH_SHORT[s.getMonth()]} ${pad2(s.getDate())} – ${MONTH_SHORT[e.getMonth()]} ${pad2(e.getDate())}, ${e.getFullYear()}`;
  }
  if (period === 'month') return `${MONTH_LONG[s.getMonth()]} ${s.getFullYear()}`;
  return `${s.getFullYear()}`;
}

export function bucketStarts(period: Period, range: Range): number[] {
  const starts: number[] = [];
  if (period === 'week') {
    for (let i = 0; i < 7; i += 1) starts.push(addDays(range.startMs, i));
  } else if (period === 'month') {
    const totalDays = Math.round((range.endMs - range.startMs) / MS.DAY);
    for (let i = 0; i < Math.ceil(totalDays / 7); i += 1) {
      starts.push(addDays(range.startMs, i * 7));
    }
  } else {
    for (let i = 0; i < 12; i += 1) starts.push(addMonths(range.startMs, i));
  }
  return starts;
}

export function bucketEndMs(period: Period, bucketStartMs: number): number {
  if (period === 'week') return bucketStartMs + MS.DAY;
  if (period === 'month') return bucketStartMs + 7 * MS.DAY;
  return addMonths(bucketStartMs, 1);
}

export function bucketLabel(period: Period, bucketStartMs: number): string {
  const d = new Date(bucketStartMs);
  if (period === 'week') return WEEKDAY_SHORT[(d.getDay() + 6) % 7];
  if (period === 'month') return `W${Math.floor((d.getDate() - 1) / 7) + 1}`;
  return MONTH_SHORT[d.getMonth()];
}
