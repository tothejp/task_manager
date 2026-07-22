import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";

// PRD 3.9: 평균 대비 ±20% 이상 편차 시 경고
const FAIRNESS_DEVIATION_THRESHOLD = 0.2;

// [관리자/PC] 구성원별 누적 배정 공정성 지표 (PRD 3.9)
export default async function FairnessPage() {
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

  const [membersRes, teamTasksRes] = await Promise.all([
    supabase.from("members").select("id, name").eq("team_id", teamId).order("name"),
    supabase.from("tasks").select("id").eq("team_id", teamId),
  ]);

  const teamTaskIds = (teamTasksRes.data ?? []).map((t) => t.id);

  const assignmentsRes =
    teamTaskIds.length > 0
      ? await supabase
          .from("assignments")
          .select("member_id, status")
          .in("task_id", teamTaskIds)
          .in("status", ["assigned", "completed"])
      : { data: [] as { member_id: string; status: string }[] };

  const countByMember = new Map<string, number>();
  for (const a of assignmentsRes.data ?? []) {
    countByMember.set(a.member_id, (countByMember.get(a.member_id) ?? 0) + 1);
  }

  const chartData = (membersRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    count: countByMember.get(m.id) ?? 0,
  }));

  const totalCount = chartData.reduce((sum, d) => sum + d.count, 0);
  const average = chartData.length > 0 ? totalCount / chartData.length : 0;
  const maxCount = Math.max(1, ...chartData.map((d) => d.count));

  const warningIds = new Set(
    average > 0
      ? chartData
          .filter((d) => Math.abs(d.count - average) > average * FAIRNESS_DEVIATION_THRESHOLD)
          .map((d) => d.id)
      : []
  );

  const warnings = chartData
    .filter((d) => warningIds.has(d.id))
    .map((d) =>
      d.count > average
        ? `${d.name}님 업무 과부하 (평균 ${average.toFixed(1)}건 대비 ${d.count}건)`
        : `${d.name}님 업무 저부하 (평균 ${average.toFixed(1)}건 대비 ${d.count}건)`
    );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">공정성 지표</h1>

      {warnings.length > 0 && (
        <div className="flex flex-col gap-1 rounded bg-orange-50 p-2 text-sm text-orange-800">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {chartData.map((d) => {
          const isWarn = warningIds.has(d.id);
          const widthPct = (d.count / maxCount) * 100;
          return (
            <div key={d.id} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 truncate">{d.name}</span>
              <div className="h-4 flex-1 rounded bg-gray-100">
                <div
                  className={`h-4 rounded ${isWarn ? "bg-orange-500" : "bg-black"}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-gray-600">{d.count}건</span>
            </div>
          );
        })}
        {chartData.length === 0 && <p className="text-sm text-gray-400">팀원이 없습니다.</p>}
      </div>

      <p className="text-xs text-gray-500">
        팀 평균 {average.toFixed(1)}건 · 배정(assigned/completed) 누적 기준, 공백(vacant)은 제외
      </p>
    </main>
  );
}
