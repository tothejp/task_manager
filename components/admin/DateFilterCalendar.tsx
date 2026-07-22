import Link from "next/link";
import { getMonthGrid, WEEKDAY_LABELS_KO } from "@/lib/date";

// [관리자/PC] 가용인원 대시보드 날짜 필터용 단순 캘린더(상태 색칠 없음, 오늘/선택일만 강조)
export function DateFilterCalendar({
  calMonth,
  selectedDate,
  today,
  dateHref,
  prevMonthHref,
  nextMonthHref,
}: {
  calMonth: string;
  selectedDate: string;
  today: string;
  dateHref: (date: string) => string;
  prevMonthHref: string;
  nextMonthHref: string;
}) {
  const cells = getMonthGrid(calMonth);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between text-sm">
        <Link href={prevMonthHref} className="rounded px-2 py-1 hover:bg-gray-50">
          ‹
        </Link>
        <span className="font-medium text-gray-900">{calMonth}</span>
        <Link href={nextMonthHref} className="rounded px-2 py-1 hover:bg-gray-50">
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAY_LABELS_KO.map((w) => (
          <div key={w} className="font-medium text-gray-400">
            {w}
          </div>
        ))}
        {cells.map((cell) => {
          const isSelected = cell.date === selectedDate;
          const isToday = cell.date === today;
          return (
            <Link
              key={cell.date}
              href={dateHref(cell.date)}
              className={[
                "rounded-lg py-2 text-xs",
                cell.inMonth ? "text-gray-900" : "text-gray-300",
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                    ? "bg-blue-50 text-blue-600"
                    : "hover:bg-gray-50",
              ].join(" ")}
            >
              {Number(cell.date.slice(-2))}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
