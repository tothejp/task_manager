"use client";

import { useState, useTransition } from "react";
import {
  updateTaskTitle,
  updateTaskDescription,
  updateTaskHeadcount,
} from "@/app/(app)/admin/tasks/actions";

const HEADCOUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

// 표 안에서 과업명을 클릭하면 바로 입력창으로 바뀌어 빠르게 고칠 수 있다
// (전체 수정은 별도 "수정" 모달에서도 가능 — 둘은 서로 다른 진입 경로일 뿐 데이터는 같다)
export function InlineTaskTitle({ taskId, title }: { taskId: string; title: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="클릭해서 수정"
        className="text-left font-medium hover:underline disabled:opacity-50"
        disabled={isPending}
      >
        {title}
      </button>
    );
  }

  function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) {
      startTransition(() => {
        void updateTaskTitle(taskId, trimmed);
      });
    } else {
      setValue(title);
    }
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          save();
        }
        if (e.key === "Escape") {
          setValue(title);
          setEditing(false);
        }
      }}
      className="w-full rounded border px-1 py-0.5 text-sm font-medium"
    />
  );
}

export function InlineTaskDescription({
  taskId,
  description,
}: {
  taskId: string;
  description: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(description ?? "");
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="클릭해서 수정"
        className="block text-left text-xs text-gray-500 hover:underline disabled:opacity-50"
        disabled={isPending}
      >
        {description || "설명 추가"}
      </button>
    );
  }

  function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed !== (description ?? "")) {
      startTransition(() => {
        void updateTaskDescription(taskId, trimmed);
      });
    }
  }

  return (
    <input
      autoFocus
      value={value}
      placeholder="설명(선택)"
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          save();
        }
        if (e.key === "Escape") {
          setValue(description ?? "");
          setEditing(false);
        }
      }}
      className="w-full rounded border px-1 py-0.5 text-xs"
    />
  );
}

export function TaskHeadcountSelect({
  taskId,
  requiredHeadcount,
}: {
  taskId: string;
  requiredHeadcount: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={requiredHeadcount}
      disabled={isPending}
      onChange={(e) => {
        const next = Number(e.target.value);
        startTransition(() => {
          void updateTaskHeadcount(taskId, next);
        });
      }}
      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
    >
      {HEADCOUNT_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n}명
        </option>
      ))}
    </select>
  );
}
