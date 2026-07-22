import { createSkillTag, grantSkill, revokeSkill } from "@/app/admin/actions";

type Member = { id: string; name: string; skillIds: string[] };
type SkillTag = { id: string; name: string };

// [관리자/PC 전용] 스킬 태그 생성 및 팀원별 부여/회수 (PRD 3.1)
export function SkillManagement({
  members,
  skillTags,
  error,
}: {
  members: Member[];
  skillTags: SkillTag[];
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded border p-4">
      <h2 className="font-medium">스킬 태그 관리</h2>

      {error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
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

      <div className="flex flex-col gap-3">
        {members.map((m) => (
          <div key={m.id} className="flex flex-col gap-1 border-t pt-2 text-sm">
            <p className="font-medium">{m.name}</p>
            <div className="flex flex-wrap gap-2">
              {skillTags.map((tag) => {
                const has = m.skillIds.includes(tag.id);
                const action = has ? revokeSkill : grantSkill;
                return (
                  <form key={tag.id} action={action}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <input type="hidden" name="skillTagId" value={tag.id} />
                    <button
                      type="submit"
                      className={
                        has
                          ? "rounded-full bg-black px-2 py-0.5 text-xs text-white"
                          : "rounded-full border px-2 py-0.5 text-xs text-gray-600"
                      }
                    >
                      {tag.name}
                    </button>
                  </form>
                );
              })}
              {skillTags.length === 0 && (
                <span className="text-xs text-gray-400">등록된 스킬 태그가 없습니다.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
