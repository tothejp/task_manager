"use client";

import { useState } from "react";

type AvailabilityStatus = "available" | "vacation" | "dayoff";

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "가용",
  vacation: "휴가",
  dayoff: "휴무",
};

export function RosterSummary({
  roster,
}: {
  roster: { id: string; name: string; status: AvailabilityStatus }[];
}) {
  const [open, setOpen] = useState(false);
  const availableCount = roster.filter((m) => m.status === "available").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="전체 인원" value={`${roster.length}명`} onClick={() => setOpen((v) => !v)} />
        <SummaryCard label="가용 인원" value={`${availableCount}명`} onClick={() => setOpen((v) => !v)} />
      </div>

      {open && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">이름</th>
              <th className="py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2">{m.name}</td>
                <td className="py-2">{STATUS_LABELS[m.status]}</td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-500">
                  해당 조건의 인원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border p-3 text-left hover:bg-gray-50"
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </button>
  );
}
