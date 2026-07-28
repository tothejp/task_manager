"use client";

import { useState, type ReactNode } from "react";
import { createTask, updateTask } from "@/app/(app)/admin/tasks/actions";

type Task = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  required_headcount: number;
};
type SkillTag = { id: string; name: string };

// 과업 생성/수정 모달 — task를 주면 수정 모드, 안 주면 새 과업 만들기 모드로 동작한다
function TaskFormModal({
  trigger,
  task,
  skillTags,
  requiredSkillIds = [],
}: {
  trigger: (open: () => void) => ReactNode;
  task?: Task;
  skillTags: SkillTag[];
  requiredSkillIds?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger(() => setOpen(true))}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            action={task ? updateTask : createTask}
            onSubmit={() => setOpen(false)}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
          >
            <h2 className="font-medium">{task ? "과업 수정" : "새 과업 만들기"}</h2>
            {task && <input type="hidden" name="taskId" value={task.id} />}

            <input
              type="text"
              name="title"
              placeholder="과업 이름"
              defaultValue={task?.title}
              required
              className="rounded border px-2 py-1 text-sm"
            />
            <textarea
              name="description"
              defaultValue={task?.description ?? ""}
              placeholder="설명(선택)"
              className="rounded border px-2 py-1 text-sm"
            />

            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col text-sm">
                날짜
                <input
                  type="date"
                  name="date"
                  defaultValue={task?.date}
                  required
                  className="rounded border px-2 py-1"
                />
              </label>
              <label className="flex flex-col text-sm">
                요구 인원수
                <input
                  type="number"
                  name="requiredHeadcount"
                  min={1}
                  defaultValue={task?.required_headcount ?? 1}
                  required
                  className="w-24 rounded border px-2 py-1"
                />
              </label>
            </div>

            <fieldset className="flex flex-col gap-1 text-sm">
              <legend className="mb-1 font-medium">필수 스킬(선택, 복수 가능)</legend>
              <div className="flex flex-wrap gap-3">
                {skillTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      name="requiredSkillIds"
                      value={tag.id}
                      defaultChecked={requiredSkillIds.includes(tag.id)}
                    />
                    {tag.name}
                  </label>
                ))}
                {skillTags.length === 0 && (
                  <span className="text-xs text-gray-400">등록된 스킬 태그가 없습니다.</span>
                )}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1.5 text-sm">
                취소
              </button>
              <button type="submit" className="rounded bg-black px-3 py-1.5 text-sm text-white">
                {task ? "저장" : "만들기"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function TaskEditButton({
  task,
  skillTags,
  requiredSkillIds,
}: {
  task: Task;
  skillTags: SkillTag[];
  requiredSkillIds: string[];
}) {
  return (
    <TaskFormModal
      task={task}
      skillTags={skillTags}
      requiredSkillIds={requiredSkillIds}
      trigger={(open) => (
        <button type="button" onClick={open} className="text-xs text-blue-600 underline">
          수정
        </button>
      )}
    />
  );
}

export function TaskCreateButton({ skillTags }: { skillTags: SkillTag[] }) {
  return (
    <TaskFormModal
      skillTags={skillTags}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="self-start rounded bg-black px-3 py-2 text-sm text-white"
        >
          새 과업 만들기
        </button>
      )}
    />
  );
}
