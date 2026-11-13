export type User = {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  password: string;
  color: string;
  isAdmin?: boolean;
};

export type Project = {
  id: string;
  tag: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
};

export type Kind = 'work1' | 'work2' | 'work3';

export const WORK_TYPES: { kind: Kind; label: string; color: string }[] = [
  { kind: 'work1', label: 'Work 1', color: '#5B8DEF' },
  { kind: 'work2', label: 'Work 2', color: '#8B7CF7' },
  { kind: 'work3', label: 'Work 3', color: '#F5A25D' },
];

export const workTypeById = (kind: Kind) =>
  WORK_TYPES.find((t) => t.kind === kind) ?? WORK_TYPES[0];

export type TimeEntry = {
  id: string;
  userId: string;
  projectId: string;
  taskId: string;
  dayMs: number;
  durationMs: number;
  kind: Kind;
};

export const USERS: User[] = [
  {
    id: 'u-phutran',
    name: 'Phú Trần',
    initials: 'PT',
    role: 'Admin',
    email: 'phutran@timemanager.app',
    password: 'demo123',
    color: '#5B8DEF',
    isAdmin: true,
  },
  {
    id: 'u-kimhai',
    name: 'Kim Hải',
    initials: 'KH',
    role: 'Product Manager',
    email: 'kimhai@timemanager.app',
    password: 'demo123',
    color: '#F5A25D',
  },
  {
    id: 'u-sonanh',
    name: 'Sơn & Anh',
    initials: 'SA',
    role: 'UI Designer',
    email: 'sonanh@timemanager.app',
    password: 'demo123',
    color: '#8B7CF7',
  },
  {
    id: 'u-buiphu',
    name: 'Bùi Thị Phú',
    initials: 'BP',
    role: 'QA Engineer',
    email: 'buiphu@timemanager.app',
    password: 'demo123',
    color: '#2FBFA6',
  },
];

export const PROJECTS: Project[] = [
  { id: 'p-ui', tag: 'UI', name: 'UI Designers', color: '#8B7CF7' },
  { id: 'p-tp', tag: 'TP', name: 'Third-party Apps', color: '#5B8DEF' },
  { id: 'p-qa', tag: 'QA', name: 'Quality Assurance', color: '#F5A25D' },
  { id: 'p-fe', tag: 'FE', name: 'Frontend Platform', color: '#F2708A' },
  { id: 'p-pm', tag: 'PM', name: 'Product Management', color: '#E78FE0' },
];

export const TASKS: Task[] = [
  { id: 't-ui-1', projectId: 'p-ui', title: 'Builds seamless digital experiences' },
  { id: 't-ui-2', projectId: 'p-ui', title: 'Creating a seamless mobile app flow is essential' },
  { id: 't-ui-3', projectId: 'p-ui', title: 'Provide a short explanation of your design decisions' },
  { id: 't-ui-4', projectId: 'p-ui', title: 'Start by mapping out the user journey' },
  { id: 't-tp-1', projectId: 'p-tp', title: 'Creates user-friendly and engaging digital experiences' },
  { id: 't-fe-1', projectId: 'p-fe', title: 'Refactor the checkout state machine' },
  { id: 't-qa-1', projectId: 'p-qa', title: 'Regression pass on the release candidate' },
  { id: 't-pm-1', projectId: 'p-pm', title: 'Prioritize the Q4 roadmap items' },
];

export const DAILY_TARGET_MS = 8 * 3_600_000;

export const userById = (id: string): User => USERS.find((u) => u.id === id) ?? USERS[0];
export const projectById = (id: string): Project => PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
export const taskById = (id: string): Task => TASKS.find((t) => t.id === id) ?? TASKS[0];
export const tasksOfProject = (projectId: string): Task[] => {
  const pool = TASKS.filter((t) => t.projectId === projectId);
  return pool.length > 0 ? pool : TASKS;
};
