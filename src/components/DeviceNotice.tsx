"use client";

import { useState } from "react";

export function DeviceNotice({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 font-semibold underline"
      >
        닫기
      </button>
    </div>
  );
}
