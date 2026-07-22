import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId, listAllTeamsForSuperadmin } from "@/lib/team-context";
import { TeamSwitcher } from "@/components/admin/TeamSwitcher";
import { approveMember, rejectMember } from "./actions";

// [관리자/PC] 팀 합류 신청한 팀원 승인 대기 목록 (이메일 인증 대체)
export default async function AdminMembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.role !== "admin") redirect("/");

  const isSuperadmin = await checkIsSuperadmin();
  const teamId = await resolveEffectiveTeamId(member, isSuperadmin);
  const allTeams = isSuperadmin ? await listAllTeamsForSuperadmin() : [];

  const { data: pendingMembers } = await supabase
    .from("members")
    .select("id, name, created_at")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">팀원 승인</h1>
        <Link href="/admin" className="text-sm underline">
          가용인원 대시보드로
        </Link>
      </div>

      {isSuperadmin && <TeamSwitcher teams={allTeams} activeTeamId={teamId} returnTo="/admin/members" />}

      <div className="flex flex-col gap-3">
        {(pendingMembers ?? []).map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded border p-3 text-sm"
          >
            <p className="font-medium">{m.name}</p>
            <div className="flex gap-2">
              <form action={approveMember.bind(null, m.id)}>
                <button
                  type="submit"
                  className="rounded bg-black px-3 py-1 text-sm text-white"
                >
                  승인
                </button>
              </form>
              <form action={rejectMember.bind(null, m.id)}>
                <button type="submit" className="rounded border px-3 py-1 text-sm">
                  거부
                </button>
              </form>
            </div>
          </div>
        ))}
        {(pendingMembers ?? []).length === 0 && (
          <p className="text-sm text-gray-400">승인 대기 중인 팀원이 없습니다.</p>
        )}
      </div>
    </main>
  );
}
