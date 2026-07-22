import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { isMobileUserAgent } from "@/lib/device";
import { getCurrentMonth, getAdjacentMonth } from "@/lib/date";
import { checkIsSuperadmin, resolveEffectiveTeamId, listAllTeamsForSuperadmin } from "@/lib/team-context";
import { SkillManagement } from "@/components/admin/SkillManagement";
import { TeamSwitcher } from "@/components/admin/TeamSwitcher";

type AvailabilityStatus = "available" | "vacation" | "dayoff";

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "가용",
  vacation: "휴가",
  dayoff: "휴무",
};

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// [관리자/PC] 가용인원 판단 + 스킬 필터링 대시보드 (PRD 3.3)
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { date?: string; skill?: string; error?: string; month?: string };
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
  const allTeams = isSuperadmin ? await listAllTeamsForSuperadmin() : [];

  const isMobile = isMobileUserAgent(headers().get("user-agent"));
  const date = searchParams.date ?? getTodayDateString();
  const selectedSkillId = searchParams.skill ?? "";
  const month = searchParams.month ?? getCurrentMonth();
  const today = getTodayDateString();

  const [membersRes, skillTagsRes, memberSkillsRes, availabilityRes] = await Promise.all([
    supabase.from("members").select("id, name").eq("team_id", teamId).order("name"),
    supabase.from("skill_tags").select("id, name").eq("team_id", teamId).order("name"),
    supabase.from("member_skills").select("member_id, skill_tag_id"),
    supabase.from("availabilities").select("member_id, status").eq("start_date", date),
  ]);

  // 미완료 강조: 과거 날짜에 배정됐지만 아직 완료 체크되지 않은 건 (PRD 3.8)
  const pastTasksRes = await supabase
    .from("tasks")
    .select("id, title, date, start_time, end_time")
    .eq("team_id", teamId)
    .lt("date", today);

  const pastTaskIds = (pastTasksRes.data ?? []).map((t) => t.id);
  const pastTasksById = new Map((pastTasksRes.data ?? []).map((t) => [t.id, t]));

  const incompleteRes =
    pastTaskIds.length > 0
      ? await supabase
          .from("assignments")
          .select("id, member_id, task_id")
          .in("task_id", pastTaskIds)
          .eq("status", "assigned")
      : { data: [] as { id: string; member_id: string; task_id: string }[] };

  const memberNameById = new Map((membersRes.data ?? []).map((m) => [m.id, m.name]));

  const incompleteList = (incompleteRes.data ?? [])
    .map((a) => {
      const task = pastTasksById.get(a.task_id);
      if (!task) return null;
      return {
        assignmentId: a.id,
        taskTitle: task.title,
        date: task.date,
        startTime: task.start_time,
        endTime: task.end_time,
        memberName: memberNameById.get(a.member_id) ?? "?",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 완료율: 선택된 월의 배정(공백 제외) 중 완료 비율 (PRD 3.8)
  const periodTasksRes = await supabase
    .from("tasks")
    .select("id")
    .eq("team_id", teamId)
    .gte("date", `${month}-01`)
    .lte("date", `${month}-31`);

  const periodTaskIds = (periodTasksRes.data ?? []).map((t) => t.id);

  const periodAssignmentsRes =
    periodTaskIds.length > 0
      ? await supabase
          .from("assignments")
          .select("status")
          .in("task_id", periodTaskIds)
          .neq("status", "vacant")
      : { data: [] as { status: string }[] };

  const totalForRate = periodAssignmentsRes.data?.length ?? 0;
  const completedForRate = (periodAssignmentsRes.data ?? []).filter(
    (a) => a.status === "completed"
  ).length;
  const completionRate = totalForRate > 0 ? Math.round((completedForRate / totalForRate) * 100) : 0;

  const members = membersRes.data ?? [];
  const skillTags = skillTagsRes.data ?? [];

  const statusByMember = new Map(
    (availabilityRes.data ?? []).map((a) => [a.member_id as string, a.status as AvailabilityStatus])
  );

  const skillsByMember = new Map<string, string[]>();
  for (const ms of memberSkillsRes.data ?? []) {
    const list = skillsByMember.get(ms.member_id) ?? [];
    list.push(ms.skill_tag_id);
    skillsByMember.set(ms.member_id, list);
  }

  // 일정 미등록 시 기본값은 "가용" (PRD 3.3: 부재만 명시적으로 등록하는 방식 전제)
  const roster = members.map((m) => ({
    id: m.id,
    name: m.name,
    status: statusByMember.get(m.id) ?? ("available" as AvailabilityStatus),
    skillIds: skillsByMember.get(m.id) ?? [],
  }));

  const availableCount = roster.filter((m) => m.status === "available").length;

  const visibleRoster = selectedSkillId
    ? roster.filter((m) => m.skillIds.includes(selectedSkillId))
    : roster;

  const skillSummaries = skillTags.map((tag) => {
    const holders = roster.filter((m) => m.skillIds.includes(tag.id));
    const availableHolders = holders.filter((m) => m.status === "available");
    return { ...tag, holderCount: holders.length, availableCount: availableHolders.length };
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">가용인원 대시보드</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/tasks" className="underline">
            과업 관리
          </Link>
          <Link href="/admin/assign" className="underline">
            과업 배정
          </Link>
          <Link href="/admin/fairness" className="underline">
            공정성 지표
          </Link>
          <Link href="/admin/members" className="underline">
            팀원 승인
          </Link>
          <Link href="/" className="underline">
            홈으로
          </Link>
        </div>
      </div>

      {isSuperadmin && <TeamSwitcher teams={allTeams} activeTeamId={teamId} returnTo="/admin" />}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col text-sm">
          날짜
          <input type="date" name="date" defaultValue={date} className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          스킬 필터
          <select name="skill" defaultValue={selectedSkillId} className="rounded border px-2 py-1">
            <option value="">전체</option>
            {skillTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
          조회
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="전체 인원" value={`${roster.length}명`} />
        <SummaryCard label="가용 인원" value={`${availableCount}명`} />
        {skillSummaries.map((s) => (
          <SummaryCard
            key={s.id}
            label={s.name}
            value={`가용 ${s.availableCount} / 보유 ${s.holderCount}명`}
          />
        ))}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">이름</th>
            <th className="py-2">상태</th>
            <th className="py-2">보유 스킬</th>
          </tr>
        </thead>
        <tbody>
          {visibleRoster.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="py-2">{m.name}</td>
              <td className="py-2">{STATUS_LABELS[m.status]}</td>
              <td className="py-2">
                {m.skillIds
                  .map((id) => skillTags.find((t) => t.id === id)?.name)
                  .filter(Boolean)
                  .join(", ") || "-"}
              </td>
            </tr>
          ))}
          {visibleRoster.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500">
                해당 조건의 인원이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">미완료 과업</h2>
        {incompleteList.length === 0 ? (
          <p className="text-sm text-gray-500">미완료 과업이 없습니다.</p>
        ) : (
          incompleteList.map((it) => (
            <p key={it.assignmentId} className="rounded bg-orange-50 p-2 text-sm text-orange-800">
              {it.date} {it.startTime.slice(0, 5)}~{it.endTime.slice(0, 5)} &apos;{it.taskTitle}&apos; — {it.memberName}
            </p>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">완료율</h2>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/admin?month=${getAdjacentMonth(month, -1)}`}>‹</Link>
            <span>{month}</span>
            <Link href={`/admin?month=${getAdjacentMonth(month, 1)}`}>›</Link>
          </div>
        </div>
        <SummaryCard label={`${month} 완료율`} value={`${completionRate}%`} />
      </section>

      {isMobile ? (
        <p className="text-sm text-gray-500">
          스킬 부여/회수 등 변경 작업은 PC에서만 가능합니다 (조회 전용).
        </p>
      ) : (
        <SkillManagement members={roster} skillTags={skillTags} error={searchParams.error} />
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
