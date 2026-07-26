import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";
import { DatePickerField } from "@/components/ui/DatePickerField";

type AvailabilityStatus = "available" | "vacation" | "dayoff";

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "가용",
  vacation: "휴가",
  dayoff: "휴무",
};

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// [관리자/PC] 중대 현황판 — 가용인원 판단 대시보드 (PRD 3.3)
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  try {
    return await AdminDashboardPageInner(searchParams);
  } catch (err) {
    return (
      <pre className="whitespace-pre-wrap break-all p-6 text-xs text-red-700">
        {String(err instanceof Error ? err.stack ?? err.message : err)}
      </pre>
    );
  }
}

async function AdminDashboardPageInner(searchParams: { date?: string }) {
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

  const date = searchParams.date ?? getTodayDateString();
  const today = getTodayDateString();

  function dateHref(d: string): string {
    return `/admin?date=${d}`;
  }

  const [membersRes, availabilityRes] = await Promise.all([
    supabase.from("members").select("id, name").eq("team_id", teamId).order("name"),
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

  const members = membersRes.data ?? [];

  const statusByMember = new Map(
    (availabilityRes.data ?? []).map((a) => [a.member_id as string, a.status as AvailabilityStatus])
  );

  // 일정 미등록 시 기본값은 "가용" (PRD 3.3: 부재만 명시적으로 등록하는 방식 전제)
  const roster = members.map((m) => ({
    id: m.id,
    name: m.name,
    status: statusByMember.get(m.id) ?? ("available" as AvailabilityStatus),
  }));

  const availableCount = roster.filter((m) => m.status === "available").length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">중대 현황판</h1>

      <DatePickerField selectedDate={date} today={today} hrefFor={dateHref} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="전체 인원" value={`${roster.length}명`} />
        <SummaryCard label="가용 인원" value={`${availableCount}명`} />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">이름</th>
            <th className="py-2">상태</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="py-2">{m.name}</td>
              <td className="py-2">{STATUS_LABELS[m.status]}</td>
            </tr>
          ))}
          {roster.length === 0 && (
            <tr>
              <td colSpan={2} className="py-4 text-center text-gray-500">
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
