import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";
import { SkillManagement } from "@/components/admin/SkillManagement";
import { approveMember, rejectMember } from "./actions";

type PendingMember = { id: string; name: string; email: string; created_at: string };

// [관리자/PC] 조직원 관리 — 가입 승인 대기 목록 + 스킬 태그 관리
export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
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

  const [teamRes, pendingRes, membersRes, skillTagsRes, memberSkillsRes] = await Promise.all([
    supabase.from("teams").select("name").eq("id", teamId).single(),
    supabase.rpc("list_pending_members_for_team", { p_team_id: teamId }),
    supabase.from("members").select("id, name").eq("team_id", teamId).eq("status", "active").order("name"),
    supabase.from("skill_tags").select("id, name").eq("team_id", teamId).order("name"),
    supabase.from("member_skills").select("member_id, skill_tag_id"),
  ]);

  const teamName = teamRes.data?.name ?? "";

  const pendingMembers = (pendingRes.data ?? []) as PendingMember[];

  const skillsByMember = new Map<string, string[]>();
  for (const ms of memberSkillsRes.data ?? []) {
    const list = skillsByMember.get(ms.member_id) ?? [];
    list.push(ms.skill_tag_id);
    skillsByMember.set(ms.member_id, list);
  }

  const roster = (membersRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    skillIds: skillsByMember.get(m.id) ?? [],
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">조직원 관리</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">가입 승인 대기</h2>
        {pendingRes.error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">
            승인 대기 목록을 불러오지 못했습니다: {pendingRes.error.message}
            {" "}(supabase/pending_members_email_rpc.sql이 Supabase에 적용됐는지 확인해주세요.)
          </p>
        )}
        <div className="flex flex-col gap-3">
          {pendingMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded border p-3 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
                <p className="text-xs text-gray-400">신청 소속: {teamName}</p>
              </div>
              <div className="flex gap-2">
                <form action={approveMember.bind(null, m.id)}>
                  <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
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
          {pendingMembers.length === 0 && (
            <p className="text-sm text-gray-400">승인 대기 중인 팀원이 없습니다.</p>
          )}
        </div>
      </section>

      <SkillManagement members={roster} skillTags={skillTagsRes.data ?? []} error={searchParams.error} />
    </main>
  );
}
