// 일정 입력 캘린더(3.2)에서 사용하는 공통 날짜 유틸.
// 반복 등록은 별도 반복 규칙 엔진 대신, 정해진 기간만큼 실제 행(row)을
// 미리 생성하는 방식으로 처리한다 (availabilities.@@unique([memberId, date])와
// 맞물려, 특정 날짜를 다시 등록하면 자연스럽게 그 날짜만 덮어쓸 수 있다).

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

// 달력에 표시할 6주(42칸) 그리드. 이전/다음 달의 날짜도 채워서 반환한다
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

// 휴가 등록: 시작~종료일 범위를 하루 단위로 나열 (양끝 포함)
export function enumerateDateRange(startStr: string, endStr: string): string[] {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  const dates: string[] = [];

  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(toDateString(d));
  }

  return dates;
}

// 휴무일 매주 반복 등록: 시작일과 같은 요일로 지정한 횟수만큼 나열
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

// 과업 매일 반복 등록: 시작일부터 하루 간격으로 지정한 횟수만큼 나열
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

// 과업 매월 반복 등록: 시작일과 같은 날짜로 지정한 횟수만큼 나열
// (말일 근처는 JS Date의 월 overflow 규칙을 따른다 — 예: 1/31 + 1개월 = 3/3)
export function enumerateMonthlyOccurrences(startStr: string, occurrences: number): string[] {
  const [year, mon, day] = startStr.split("-").map(Number);
  const dates: string[] = [];

  for (let i = 0; i < occurrences; i++) {
    const d = new Date(Date.UTC(year, mon - 1 + i, day));
    dates.push(toDateString(d));
  }

  return dates;
}
