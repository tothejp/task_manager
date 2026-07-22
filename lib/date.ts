export const WEEKDAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

const DAYS_PER_WEEK = 7;
const CALENDAR_GRID_WEEKS = 6;

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getAdjacentMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, mon - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthGrid(month: string): { date: string; inMonth: boolean }[] {
  const [year, mon] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, mon - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();

  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - startWeekday);

  const cells: { date: string; inMonth: boolean }[] = [];
  const cursor = new Date(gridStart);
  const totalCells = CALENDAR_GRID_WEEKS * DAYS_PER_WEEK;

  for (let i = 0; i < totalCells; i++) {
    cells.push({
      date: toDateString(cursor),
      inMonth: cursor.getUTCMonth() === mon - 1,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return cells;
}

export function enumerateDateRange(startStr: string, endStr: string): string[] {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  const dates: string[] = [];

  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(toDateString(d));
  }

  return dates;
}

export function enumerateWeeklyOccurrences(startStr: string, occurrences: number): string[] {
  const start = new Date(`${startStr}T00:00:00Z`);
  const dates: string[] = [];

  for (let i = 0; i < occurrences; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i * DAYS_PER_WEEK);
    dates.push(toDateString(d));
  }

  return dates;
}

export function enumerateDailyOccurrences(startStr: string, occurrences: number): string[] {
  const start = new Date(`${startStr}T00:00:00Z`);
  const dates: string[] = [];

  for (let i = 0; i < occurrences; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(toDateString(d));
  }

  return dates;
}

export function enumerateMonthlyOccurrences(startStr: string, occurrences: number): string[] {
  const [year, mon, day] = startStr.split("-").map(Number);
  const dates: string[] = [];

  for (let i = 0; i < occurrences; i++) {
    const d = new Date(Date.UTC(year, mon - 1 + i, day));
    dates.push(toDateString(d));
  }

  return dates;
}
