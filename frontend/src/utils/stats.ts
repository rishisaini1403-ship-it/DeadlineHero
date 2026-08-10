interface TaskLike {
  status?: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTaskDate(t: TaskLike): Date {
  return new Date(t.updatedAt || t.createdAt || Date.now());
}

export function calculateCurrentStreak(tasks: TaskLike[]): number {
  const dateStrs = tasks
    .filter(t => t.status === 'completed')
    .map(t => toLocalDateStr(getTaskDate(t)));
  const unique = [...new Set(dateStrs)].sort();
  if (unique.length === 0) return 0;

  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);

  const lastDate = unique[unique.length - 1];
  if (lastDate !== todayStr && lastDate !== yesterdayStr) return 0;

  let curs = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    const curr = new Date(unique[i + 1]);
    const prev = new Date(unique[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) curs++;
    else break;
  }
  return curs;
}

export function calculateBestStreak(tasks: TaskLike[]): number {
  const dateStrs = tasks
    .filter(t => t.status === 'completed')
    .map(t => toLocalDateStr(getTaskDate(t)));
  const unique = [...new Set(dateStrs)].sort();
  if (unique.length === 0) return 0;

  let best = 0;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const curr = new Date(unique[i]);
    const prev = new Date(unique[i - 1]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) run++;
    else { best = Math.max(best, run); run = 1; }
  }
  return Math.max(best, run);
}

export function calculateWeeklyConsistency(tasks: TaskLike[]): number {
  const now = new Date();
  let count = 0;
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const targetStr = toLocalDateStr(date);
    const hasCompletion = tasks.some(t => {
      if (t.status !== 'completed') return false;
      return toLocalDateStr(getTaskDate(t)) === targetStr;
    });
    if (hasCompletion) count++;
  }
  return count;
}

export function calculateMostProductiveDay(tasks: TaskLike[]): { date: string; count: number } | null {
  const dateStrs = tasks
    .filter(t => t.status === 'completed')
    .map(t => toLocalDateStr(getTaskDate(t)));
  if (dateStrs.length === 0) return null;
  const counts: Record<string, number> = {};
  dateStrs.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  const entries = Object.entries(counts);
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { date: entries[0][0], count: entries[0][1] };
}
