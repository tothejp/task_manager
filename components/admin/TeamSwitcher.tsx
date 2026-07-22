import { setActiveTeam } from "@/lib/team-switch-action";

// [슈퍼관리자 전용] 관리자 화면에서 조회/조작할 팀을 전환하는 드롭다운
export function TeamSwitcher({
  teams,
  activeTeamId,
  returnTo,
}: {
  teams: { id: string; name: string }[];
  activeTeamId: string;
  returnTo: string;
}) {
  return (
    <form action={setActiveTeam} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="returnTo" value={returnTo} />
      <select name="teamId" defaultValue={activeTeamId} className="rounded border px-2 py-1">
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded border px-2 py-1">
        전환
      </button>
    </form>
  );
}
