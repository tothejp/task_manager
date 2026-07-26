"use client";

import { useState } from "react";
import Link from "next/link";
import { getMonthGrid, getAdjacentMonth, WEEKDAY_LABELS_KO } from "@/lib/date";

// 앱 전역 날짜 필터용 공용 컴포넌트: 평소엔 선택된 날짜만 보여주고,
// 클릭하면 모달로 월 달력이 뜬다. 날짜를 고르거나 배경을 클릭하면 닫힌다.
//
// 주의: 서버 컴포넌트 → 클라이언트 컴포넌트 경계로는 함수를 prop으로 넘길 수 없다
// (직렬화 불가 — 넘기면 렌더링 중 서버 예외 발생). 그래서 콜백 대신 basePath/paramName
// 문자열만 받아서 href를 이 컴포넌트 내부에서 직접 조립한다.
export function DatePickerField({
  selectedDate,
  today,
  basePath,
  paramName = "date",
}: {
  selectedDate: string;
  today: string;
  basePath: string;
  paramName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate.slice(0, 7));

  const cells = getMonthGrid(viewMonth);
  const hrefFor = (date: string) => `${basePath}?${paramName}=${date}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base font-medium text-gray-900 hover:bg-gray-50"
      >
        {selectedDate === today ? `오늘 (${selectedDate})` : selectedDate}
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="flex w-full max-w-xs flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setViewMonth((m) => getAdjacentMonth(m, -1))}
                className="rounded px-2 py-1 hover:bg-gray-50"
              >
                ‹
              </button>
              <span className="font-medium text-gray-900">{viewMonth}</span>
              <button
                type="button"
                onClick={() => setViewMonth((m) => getAdjacentMonth(m, 1))}
                className="rounded px-2 py-1 hover:bg-gray-50"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
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
                    href={hrefFor(cell.date)}
                    onClick={() => setExpanded(false)}
                    className={[
                      "rounded-lg py-2 text-sm",
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
        </div>
      )}
    </div>
  );
}
