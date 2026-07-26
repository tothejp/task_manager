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

  const [activeTeamId, teams] = await Promise.all([
    member.role === "admin" ? resolveEffectiveTeamId(member, isSuperadmin) : Promise.resolve(member.team_id),
    isSuperadmin ? listAllTeamsForSuperadmin() : Promise.resolve([]),
  ]);

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
