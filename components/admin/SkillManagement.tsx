"use client";

import { useState } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { createSkillTag, grantSkill, revokeSkill } from "@/app/(app)/admin/organization/actions";

type Member = { id: string; name: string; skillIds: string[] };
type SkillTag = { id: string; name: string };

// [관리자/PC 전용] 스킬 태그 생성 + Drag & Drop으로 조직원별 부여/회수 (PRD 3.1)
export function SkillManagement({
  members,
  skillTags,
  error,
}: {
  members: Member[];
  skillTags: SkillTag[];
  error?: string;
}) {
  const [dragError, setDragError] = useState<string | null>(null);
  const skillNameById = new Map(skillTags.map((t) => [t.id, t.name]));

  function handleDragEnd(event: DragEndEvent) {
    const skillTagId = event.active.id as string;
    const memberId = event.over?.id as string | undefined;
    if (!memberId) return;

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (member.skillIds.includes(skillTagId)) {
      setDragError(`${member.name}님은 이미 '${skillNameById.get(skillTagId) ?? ""}' 스킬을 보유하고 있습니다.`);
      return;
    }

    setDragError(null);
    void grantSkill(memberId, skillTagId).then((result) => {
      if (!result.ok) setDragError(result.error);
    });
  }

  async function handleRevoke(memberId: string, skillTagId: string) {
    setDragError(null);
    const result = await revokeSkill(memberId, skillTagId);
    if (!result.ok) setDragError(result.error);
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 rounded border p-4">
        <h2 className="font-medium">스킬 태그 관리</h2>

        {(error || dragError) && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error || dragError}</p>
        )}

        <form action={createSkillTag} className="flex gap-2">
          <input
            type="text"
            name="skillName"
            placeholder="새 스킬 태그 (예: 지게차운전)"
            required
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
            추가
          </button>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">
            아래 스킬 태그를 조직원 위로 끌어다 놓으면 부여됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {skillTags.map((tag) => (
              <SkillChipDraggable key={tag.id} tag={tag} />
            ))}
            {skillTags.length === 0 && (
              <span className="text-xs text-gray-400">등록된 스킬 태그가 없습니다.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberDropRow key={m.id} member={m} skillNameById={skillNameById} onRevoke={handleRevoke} />
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-400">조직원이 없습니다.</p>
          )}
        </div>
      </div>
    </DndContext>
  );
}

function SkillChipDraggable({ tag }: { tag: SkillTag }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tag.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-full border bg-white px-3 py-1 text-sm shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      {tag.name}
    </div>
  );
}

function MemberDropRow({
  member,
  skillNameById,
  onRevoke,
}: {
  member: Member;
  skillNameById: Map<string, string>;
  onRevoke: (memberId: string, skillTagId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: member.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-1 rounded border-t p-2 text-sm ${isOver ? "bg-blue-50" : ""}`}
    >
      <p className="font-medium">{member.name}</p>
      <div className="flex flex-wrap gap-2">
        {member.skillIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onRevoke(member.id, id)}
            title="클릭해서 회수"
            className="rounded-full bg-black px-2 py-0.5 text-xs text-white"
          >
            {skillNameById.get(id) ?? id} ×
          </button>
        ))}
        {member.skillIds.length === 0 && (
          <span className="text-xs text-gray-400">보유 스킬 없음</span>
        )}
      </div>
    </div>
  );
}
