"use client";

import { useState } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { isTimeOverlapping } from "@/lib/time-overlap";
import type { AutoAssignResult } from "@/lib/auto-assign";
import {
  assignMember,
  unassignMember,
  getAutoAssignRecommendations,
  confirmAutoAssignments,
} from "@/app/admin/assign/actions";

export type MemberCard = {
  id: string;
  name: string;
  skillIds: string[];
  assignedSlots: { taskId: string; title: string; startTime: string; endTime: string }[];
};

export type TaskSlot = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  requiredHeadcount: number;
  requiredSkillIds: string[];
  assignedMembers: { assignmentId: string; memberId: string; name: string; skillOverride: boolean }[];
};

type PendingConfirm = {
  memberId: string;
  memberName: string;
  taskId: string;
  missingSkillNames: string[];
};

export function AssignmentBoard({
  date,
  members,
  tasks,
  skillNameById,
  gapNoticesByTask,
}: {
  date: string;
  members: MemberCard[];
  tasks: TaskSlot[];
  skillNameById: Record<string, string>;
  gapNoticesByTask: Record<string, string[]>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [preview, setPreview] = useState<AutoAssignResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const membersById = new Map(members.map((m) => [m.id, m]));
  const tasksById = new Map(tasks.map((t) => [t.id, t]));

  async function tryAssign(memberId: string, taskId: string, skillOverride: boolean) {
    setIsPending(true);
    setError(null);
    const result = await assignMember(taskId, memberId, skillOverride);
    setIsPending(false);
    if (!result.ok) {
      setError(result.error);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const memberId = event.active.id as string;
    const taskId = event.over?.id as string | undefined;
    if (!taskId) return;

    const member = membersById.get(memberId);
    const task = tasksById.get(taskId);
    if (!member || !task) return;

    setError(null);

    // 이미 배정된 인원인지 확인
    if (task.assignedMembers.some((a) => a.memberId === memberId)) {
      setError(`${member.name}님은 이미 '${task.title}'에 배정되어 있습니다.`);
      return;
    }

    // 요구 인원 초과 시 거부 (PRD 3.5)
    if (task.assignedMembers.length >= task.requiredHeadcount) {
      setError(`'${task.title}'의 요구 인원이 모두 채워졌습니다.`);
      return;
    }

    // 시간 중복 하드 차단 (PRD 3.5, CLAUDE.md 2.3 공통 유틸 사용)
    const conflict = member.assignedSlots.find((slot) =>
      isTimeOverlapping(slot.startTime, slot.endTime, task.startTime, task.endTime)
    );
    if (conflict) {
      setError(
        `${member.name}님은 ${conflict.startTime.slice(0, 5)}~${conflict.endTime.slice(0, 5)}에 이미 '${conflict.title}'에 배정되어 있어 배정할 수 없습니다.`
      );
      return;
    }

    // 필수 스킬 미보유는 하드 차단이 아니라 경고 모달 (PRD 3.5, CLAUDE.md 2.4)
    const missingSkillIds = task.requiredSkillIds.filter((id) => !member.skillIds.includes(id));
    if (missingSkillIds.length > 0) {
      setPendingConfirm({
        memberId,
        memberName: member.name,
        taskId,
        missingSkillNames: missingSkillIds.map((id) => skillNameById[id] ?? id),
      });
      return;
    }

    void tryAssign(memberId, taskId, false);
  }

  async function handleAutoAssign() {
    setError(null);
    setPreviewLoading(true);
    const result = await getAutoAssignRecommendations(date);
    setPreviewLoading(false);
    setPreview(result);
  }

  function removeRecommendation(taskId: string, memberId: string) {
    setPreview((prev) =>
      prev
        ? {
            ...prev,
            recommendations: prev.recommendations.filter(
              (r) => !(r.taskId === taskId && r.memberId === memberId)
            ),
          }
        : prev
    );
  }

  async function handleConfirmPreview() {
    if (!preview) return;
    setIsPending(true);
    setError(null);
    const result = await confirmAutoAssignments(preview.recommendations);
    setIsPending(false);
    setPreview(null);
    if (result.failedCount > 0) {
      setError(`${result.failedCount}건은 배정하지 못했습니다 (다른 배정과 충돌했을 수 있습니다).`);
    }
  }

  function handleCancelPreview() {
    setPreview(null);
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAutoAssign}
          disabled={!!preview || previewLoading}
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
        >
          {previewLoading ? "계산 중..." : "자동배정 추천받기"}
        </button>
        {preview && (
          <>
            <button
              type="button"
              onClick={handleConfirmPreview}
              disabled={isPending}
              className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              확정
            </button>
            <button
              type="button"
              onClick={handleCancelPreview}
              className="rounded border px-3 py-2 text-sm"
            >
              취소
            </button>
          </>
        )}
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {preview && (
        <p className="rounded bg-blue-50 p-2 text-sm text-blue-800">
          자동배정 미리보기입니다. 추천 항목(점선)을 클릭하면 제외할 수 있고, 확정을 눌러야 실제로 반영됩니다.
        </p>
      )}

      {preview && preview.shortfalls.length > 0 && (
        <div className="rounded bg-orange-50 p-2 text-sm text-orange-800">
          {preview.shortfalls.map((s) => (
            <p key={s.taskId}>
              &apos;{s.taskTitle}&apos;: 필요 인원 {s.requiredHeadcount}명 중 {s.filledTotal}명만 배정됨 —{" "}
              {s.reason}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-gray-500">가용 인원</h2>
          {members.map((m) => (
            <MemberDraggable key={m.id} member={m} skillNameById={skillNameById} disabled={!!preview} />
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-400">이 날짜에 가용한 인원이 없습니다.</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {tasks.map((t) => (
            <TaskDroppable
              key={t.id}
              task={t}
              skillNameById={skillNameById}
              disabled={isPending || !!preview}
              pendingForTask={(preview?.recommendations ?? [])
                .filter((r) => r.taskId === t.id)
                .map((r) => ({ memberId: r.memberId, memberName: membersById.get(r.memberId)?.name ?? "?" }))}
              onRemovePending={(memberId) => removeRecommendation(t.id, memberId)}
              gapNames={gapNoticesByTask[t.id] ?? []}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-gray-400">이 날짜에 등록된 과업이 없습니다.</p>
          )}
        </div>
      </div>

      {pendingConfirm && (
        <SkillWarningModal
          confirm={pendingConfirm}
          onCancel={() => setPendingConfirm(null)}
          onConfirm={() => {
            void tryAssign(pendingConfirm.memberId, pendingConfirm.taskId, true);
            setPendingConfirm(null);
          }}
        />
      )}
    </DndContext>
  );
}

function MemberDraggable({
  member,
  skillNameById,
  disabled,
}: {
  member: MemberCard;
  skillNameById: Record<string, string>;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: member.id,
    disabled,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded border bg-white p-2 text-sm shadow-sm ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-grab"
      } ${isDragging ? "z-10 opacity-50" : ""}`}
    >
      <p className="font-medium">{member.name}</p>
      {member.skillIds.length > 0 && (
        <p className="text-xs text-gray-500">
          {member.skillIds.map((id) => skillNameById[id] ?? id).join(", ")}
        </p>
      )}
      {member.assignedSlots.length > 0 && (
        <p className="text-xs text-blue-600">
          {member.assignedSlots
            .map((s) => `${s.startTime.slice(0, 5)}~${s.endTime.slice(0, 5)} ${s.title}`)
            .join(" / ")}
        </p>
      )}
    </div>
  );
}

function TaskDroppable({
  task,
  skillNameById,
  disabled,
  pendingForTask,
  onRemovePending,
  gapNames,
}: {
  task: TaskSlot;
  skillNameById: Record<string, string>;
  disabled: boolean;
  pendingForTask: { memberId: string; memberName: string }[];
  onRemovePending: (memberId: string) => void;
  gapNames: string[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: task.id });
  const effectiveAssignedCount = task.assignedMembers.length + pendingForTask.length;
  const emptySlots = Math.max(task.requiredHeadcount - effectiveAssignedCount, 0);
  const isFull = emptySlots === 0;

  return (
    <div
      ref={setNodeRef}
      className={`rounded border p-3 ${isOver ? "border-black" : ""} ${isFull ? "bg-green-50" : ""}`}
    >
      {gapNames.length > 0 && (
        <p className="mb-2 rounded bg-red-50 p-1.5 text-xs text-red-700">
          휴가로 공백 발생: {gapNames.join(", ")} — 재배정이 필요합니다.
        </p>
      )}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-xs text-gray-500">
            {task.startTime.slice(0, 5)}~{task.endTime.slice(0, 5)} · 요구 {task.requiredHeadcount}명
            {task.requiredSkillIds.length > 0 && (
              <> · 필수 스킬: {task.requiredSkillIds.map((id) => skillNameById[id] ?? id).join(", ")}</>
            )}
          </p>
        </div>
        <span className={`text-xs ${isFull ? "text-green-700" : "text-orange-600"}`}>
          {isFull ? "충원 완료" : `미충원 ${emptySlots}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {task.assignedMembers.map((a) => (
          <form key={a.assignmentId} action={unassignMember.bind(null, a.assignmentId)}>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-full bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
              title="클릭해서 배정 취소"
            >
              {a.name} {a.skillOverride ? "⚠" : ""} ×
            </button>
          </form>
        ))}
        {pendingForTask.map((p) => (
          <button
            key={p.memberId}
            type="button"
            onClick={() => onRemovePending(p.memberId)}
            className="rounded-full border border-dashed border-orange-500 px-2 py-1 text-xs text-orange-700"
            title="클릭해서 추천에서 제외"
          >
            {p.memberName} (추천) ×
          </button>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <span key={i} className="rounded-full border border-dashed px-2 py-1 text-xs text-gray-400">
            빈 슬롯
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillWarningModal({
  confirm,
  onCancel,
  onConfirm,
}: {
  confirm: PendingConfirm;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-80 rounded bg-white p-4">
        <p className="mb-4 text-sm">
          {confirm.memberName}님은 &apos;{confirm.missingSkillNames.join(", ")}&apos; 스킬이 없습니다.
          그래도 배정하시겠습니까?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded border px-3 py-1 text-sm">
            취소
          </button>
          <button onClick={onConfirm} className="rounded bg-black px-3 py-1 text-sm text-white">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
