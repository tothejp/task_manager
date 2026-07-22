import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { isMobileUserAgent } from "@/lib/device";
import { AssignmentBoard, type MemberCard, type TaskSlot } from "@/components/admin/AssignmentBoard";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// [관리자/PC] Drag & Drop 과업-인원 배정 화면 (PRD 3.5)
export default async function AdminAssignPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.role !== "admin") redirect("/");

  const date = searchParams.date ?? getTodayDateString();

  const [membersRes, availRes, skillTagsRes, memberSkillsRes, tasksRes, requiredSkillsRes] =
    await Promise.all([
      supabase.from("members").select("id, name").eq("team_id", member.team_id).order("name"),
      supabase.from("availabilities").select("member_id, status").eq("start_date", date),
      supabase.from("skill_tags").select("id, name").eq("team_id", member.team_id),
      supabase.from("member_skills").select("member_id, skill_tag_id"),
      supabase
        .from("tasks")
        .select("id, title, start_time, end_time, required_headcount")
        .eq("team_id", member.team_id)
        .eq("date", date)
        .order("start_time"),
      supabase.from("task_skills").select("task_id, skill_tag_id"),
    ]);

  const taskIds = (tasksRes.data ?? []).map((t) => t.id);

  const [assignmentsRes, emptyAssignmentsRes] = await Promise.all([
    taskIds.length > 0
      ? supabase
          .from("assignments")
          .select("id, task_id, member_id, skill_override")
          .in("task_id", taskIds)
          .neq("status", "vacant")
      : Promise.resolve({ data: [] as { id: string; task_id: string; member_id: string; skill_override: boolean }[] }),
    taskIds.length > 0
      ? supabase
          .from("assignments")
          .select("task_id, member_id")
          .in("task_id", taskIds)
          .eq("status", "vacant")
      : Promise.resolve({ data: [] as { task_id: string; member_id: string }[] }),
  ]);

  const members = membersRes.data ?? [];
  const skillTags = skillTagsRes.data ?? [];
  const tasksData = tasksRes.data ?? [];

  const statusByMember = new Map((availRes.data ?? []).map((a) => [a.member_id, a.status]));

  const skillsByMember = new Map<string, string[]>();
  for (const ms of memberSkillsRes.data ?? []) {
    const list = skillsByMember.get(ms.member_id) ?? [];
    list.push(ms.skill_tag_id);
    skillsByMember.set(ms.member_id, list);
  }

  const requiredSkillsByTask = new Map<string, string[]>();
  for (const rs of requiredSkillsRes.data ?? []) {
    const list = requiredSkillsByTask.get(rs.task_id) ?? [];
    list.push(rs.skill_tag_id);
    requiredSkillsByTask.set(rs.task_id, list);
  }

  const tasksById = new Map(tasksData.map((t) => [t.id, t]));
  const nameById = new Map(members.map((m) => [m.id, m.name]));

  const assignmentsByMember = new Map<string, { assignmentId: string; taskId: string }[]>();
  const assignmentsByTask = new Map<
    string,
    { assignmentId: string; memberId: string; skillOverride: boolean }[]
  >();

  for (const a of assignmentsRes.data ?? []) {
    const task = tasksById.get(a.task_id);
    if (!task) continue;

    const byMember = assignmentsByMember.get(a.member_id) ?? [];
    byMember.push({ assignmentId: a.id, taskId: a.task_id });
    assignmentsByMember.set(a.member_id, byMember);

    const byTask = assignmentsByTask.get(a.task_id) ?? [];
    byTask.push({ assignmentId: a.id, memberId: a.member_id, skillOverride: a.skill_override });
    assignmentsByTask.set(a.task_id, byTask);
  }

  // 좌측 목록: 이 날짜에 "가용" 상태인 인원만 (휴가/휴무 제외, PRD 3.5)
  const availableMembers: MemberCard[] = members
    .filter((m) => (statusByMember.get(m.id) ?? "available") === "available")
    .map((m) => ({
      id: m.id,
      name: m.name,
      skillIds: skillsByMember.get(m.id) ?? [],
      assignedSlots: (assignmentsByMember.get(m.id) ?? []).map((a) => {
        const task = tasksById.get(a.taskId)!;
        return {
          taskId: a.taskId,
          title: task.title,
          startTime: task.start_time,
          endTime: task.end_time,
        };
      }),
    }));

  const taskSlots: TaskSlot[] = tasksData.map((t) => ({
    id: t.id,
    title: t.title,
    startTime: t.start_time,
    endTime: t.end_time,
    requiredHeadcount: t.required_headcount,
    requiredSkillIds: requiredSkillsByTask.get(t.id) ?? [],
    assignedMembers: (assignmentsByTask.get(t.id) ?? []).map((a) => ({
      assignmentId: a.assignmentId,
      memberId: a.memberId,
      name: nameById.get(a.memberId) ?? "?",
      skillOverride: a.skillOverride,
    })),
  }));

  const gapsByTask = new Map<string, string[]>();
  for (const a of emptyAssignmentsRes.data ?? []) {
    const list = gapsByTask.get(a.task_id) ?? [];
    list.push(nameById.get(a.member_id) ?? "?");
    gapsByTask.set(a.task_id, list);
  }
  const gapNoticesByTask = Object.fromEntries(gapsByTask);

  const skillNameById = Object.fromEntries(skillTags.map((s) => [s.id, s.name]));
  const isMobile = isMobileUserAgent(headers().get("user-agent"));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">과업 배정</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/tasks" className="underline">
            과업 관리
          </Link>
          <Link href="/admin" className="underline">
            가용인원 대시보드
          </Link>
          <Link href="/" className="underline">
            홈으로
          </Link>
        </div>
      </div>

      <form method="get" className="flex items-end gap-3">
        <label className="flex flex-col text-sm">
          날짜
          <input type="date" name="date" defaultValue={date} className="rounded border px-2 py-1" />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
          조회
        </button>
      </form>

      {isMobile ? (
        <ReadOnlyAssignmentList
          tasks={taskSlots}
          skillNameById={skillNameById}
          gapNoticesByTask={gapNoticesByTask}
        />
      ) : (
        <AssignmentBoard
          date={date}
          members={availableMembers}
          tasks={taskSlots}
          skillNameById={skillNameById}
          gapNoticesByTask={gapNoticesByTask}
        />
      )}
    </main>
  );
}

// 관리자가 모바일로 접속하면 Drag & Drop 대신 조회 전용 목록만 노출한다 (PRD 2장 정책)
function ReadOnlyAssignmentList({
  tasks,
  skillNameById,
  gapNoticesByTask,
}: {
  tasks: TaskSlot[];
  skillNameById: Record<string, string>;
  gapNoticesByTask: Record<string, string[]>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">배정 변경은 PC에서만 가능합니다 (조회 전용).</p>
      {tasks.map((t) => {
        const emptySlots = Math.max(t.requiredHeadcount - t.assignedMembers.length, 0);
        const gapNames = gapNoticesByTask[t.id] ?? [];
        return (
          <div key={t.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{t.title}</p>
            <p className="text-xs text-gray-500">
              {t.startTime.slice(0, 5)}~{t.endTime.slice(0, 5)} · 요구 {t.requiredHeadcount}명
              {t.requiredSkillIds.length > 0 && (
                <> · 필수 스킬: {t.requiredSkillIds.map((id) => skillNameById[id] ?? id).join(", ")}</>
              )}
            </p>
            <p className="mt-1">
              배정: {t.assignedMembers.map((a) => a.name).join(", ") || "없음"}
              {emptySlots > 0 && <span className="text-orange-600"> (미충원 {emptySlots})</span>}
            </p>
            {gapNames.length > 0 && (
              <p className="mt-1 text-xs text-red-600">
                휴가로 공백 발생: {gapNames.join(", ")} — 재배정이 필요합니다.
              </p>
            )}
          </div>
        );
      })}
      {tasks.length === 0 && (
        <p className="text-sm text-gray-400">이 날짜에 등록된 과업이 없습니다.</p>
      )}
    </div>
  );
}
