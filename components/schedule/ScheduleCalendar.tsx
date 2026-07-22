"use client";

import { useState } from "react";
import { setDayStatus, clearDayStatus } from "@/app/(app)/schedule/actions";
import { getMonthGrid, WEEKDAY_LABELS_KO } from "@/lib/date";

type AvailabilityStatus = "available" | "vacation" | "dayoff";

export type AvailabilityRow = {
  start_date: string;
  status: AvailabilityStatus;
  repeat_type: string | null;
};

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "가용",
  vacation: "휴가",
  dayoff: "휴무",
};

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: "bg-green-100 text-green-800",
  vacation: "bg-orange-100 text-orange-800",
  dayoff: "bg-gray-200 text-gray-700",
};

export function ScheduleCalendar({
  month,
  availabilities,
}: {
  month: string;
  availabilities: AvailabilityRow[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const byDate = new Map(availabilities.map((a) => [a.start_date, a]));
  const cells = getMonthGrid(month);
  const selected = selectedDate ? byDate.get(selectedDate) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAY_LABELS_KO.map((w) => (
          <div key={w} className="font-medium text-gray-500">
            {w}
          </div>
        ))}
        {cells.map((cell) => {
          const entry = byDate.get(cell.date);
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => setSelectedDate(cell.date)}
              className={[
                "rounded py-2 text-xs",
                cell.inMonth ? "" : "opacity-30",
                selectedDate === cell.date ? "ring-2 ring-black" : "",
                entry ? STATUS_COLORS[entry.status] : "bg-white",
              ].join(" ")}
            >
              {Number(cell.date.slice(-2))}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="rounded border p-3">
          <p className="mb-2 text-sm font-medium">
            {selectedDate}{" "}
            {selected ? `(${STATUS_LABELS[selected.status]})` : "(미지정 · 가용으로 처리)"}
          </p>

          <form action={setDayStatus} className="flex flex-col gap-2">
            <input type="hidden" name="date" value={selectedDate} />
            <StatusFields />
          </form>

          {selected && (
            <form action={clearDayStatus} className="mt-2">
              <input type="hidden" name="date" value={selectedDate} />
              <button type="submit" className="text-xs text-red-600 underline">
                등록 취소(초기화)
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function StatusFields() {
  const [status, setStatus] = useState<AvailabilityStatus>("vacation");

  return (
    <>
      <div className="flex gap-3 text-sm">
        {(["available", "vacation", "dayoff"] as const).map((s) => (
          <label key={s} className="flex items-center gap-1">
            <input
              type="radio"
              name="status"
              value={s}
              checked={status === s}
              onChange={() => setStatus(s)}
            />
            {STATUS_LABELS[s]}
          </label>
        ))}
      </div>

      {status === "vacation" && (
        <label className="flex items-center gap-2 text-sm">
          종료일(선택)
          <input type="date" name="endDate" className="rounded border px-2 py-1" />
        </label>
      )}

      {status === "dayoff" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="repeatWeekly" />
          매주 반복 (다음 8주간 자동 등록)
        </label>
      )}

      <button type="submit" className="mt-1 rounded bg-black px-3 py-2 text-sm text-white">
        저장
      </button>
    </>
  );
}
