import type { CurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId, listAllTeamsForSuperadmin } from "@/lib/team-context";
import { Sidebar } from "./Sidebar";

export async function AppShell({
  member,
  children,
}: {
  member: CurrentMember;
  children: React.ReactNode;
}) {
  const isSuperadmin = member.role === "admin" ? await checkIsSuperadmin() : false;
  const activeTeamId =
    member.role === "admin" ? await resolveEffectiveTeamId(member, isSuperadmin) : member.team_id;
  const teams = isSuperadmin ? await listAllTeamsForSuperadmin() : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={member.role}
        memberName={member.name}
        teamName={member.teams?.name ?? ""}
        isSuperadmin={isSuperadmin}
        teams={teams}
        activeTeamId={activeTeamId}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
