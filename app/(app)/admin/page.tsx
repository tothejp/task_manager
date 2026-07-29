import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getCurrentMember } from "@/lib/get-current-member";
import { isMobileUserAgent } from "@/lib/device";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { RosterSummary } from "@/components/admin/RosterSummary";
import {
  AssignmentBoard,
  ReadOnlyAssignmentList,
  type MemberCard,
  type TaskSlot,
} from "@/components/admin/AssignmentBoard";

type AvailabilityStatus = "available" | "vacation" | "dayoff";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// [관리자/PC] 중대 현황판 — 가용인원 판단 + 과업 배정 (PRD 3.3, 3.5)
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.role !== "admin") redirect("/");

  const isSuperadmin = await checkIsSuperadmin();
  const teamId = await resolveEffectiveTeamId(member, isSuperadmin);

  const date = searchParams.date ?? getTodayDateString();
  const today = getTodayDateString();
  const isMobile = isMobileUserAgent(headers().get("user-agent"));

  const [membersRes, availabilityRes, skillTagsRes, memberSkillsRes, tasksRes, requiredSkillsRes] =
    await Promise.all([
      supabase.from("members").select("id, name").eq("team_id", teamId).order("name"),
      supabase.from("availabilities").select("member_id, status").eq("start_date", date),
      supabase.from("skill_tags").select("id, name"), // 모든 팀이 공유하는 전역 스킬 카탈로그
      supabase.from("member_skills").select("member_id, skill_tag_id"),
      supabase
        .from("tasks")
        .select("id, title, start_time, end_time, required_headcount")
        .eq("team_id", teamId)
        .eq("date", date)
        .order("start_time"),
      supabase.from("task_skills").select("task_id, skill_tag_id"),
    ]);

  // 미완료 강조: 과거 날짜에 배정됐지만 아직 완료 체크되지 않은 건 (PRD 3.8)
  const pastTasksRes = await supabase
    .from("tasks")
    .select("id, title, date")
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
        memberName: memberNameById.get(a.member_id) ?? "?",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const members = membersRes.data ?? [];
  const skillTags = skillTagsRes.data ?? [];
  const tasksData = tasksRes.data ?? [];

  const statusByMember = new Map(
    (availabilityRes.data ?? []).map((a) => [a.member_id as string, a.status as AvailabilityStatus])
  );

  // 일정 미등록 시 기본값은 "가용" (PRD 3.3: 부재만 명시적으로 등록하는 방식 전제)
  const roster = members.map((m) => ({
    id: m.id,
    name: m.name,
    status: statusByMember.get(m.id) ?? ("available" as AvailabilityStatus),
  }));

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

  const taskIds = tasksData.map((t) => t.id);

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

  const tasksById = new Map(tasksData.map((t) => [t.id, t]));

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
      name: memberNameById.get(a.memberId) ?? "?",
      skillOverride: a.skillOverride,
    })),
  }));

  const gapsByTask = new Map<string, string[]>();
  for (const a of emptyAssignmentsRes.data ?? []) {
    const list = gapsByTask.get(a.task_id) ?? [];
    list.push(memberNameById.get(a.member_id) ?? "?");
    gapsByTask.set(a.task_id, list);
  }
  const gapNoticesByTask = Object.fromEntries(gapsByTask);

  const skillNameById = Object.fromEntries(skillTags.map((s) => [s.id, s.name]));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">중대 현황판</h1>

      <DatePickerField selectedDate={date} today={today} basePath="/admin" />

      <RosterSummary roster={roster} />

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">미완료 과업</h2>
        {incompleteList.length === 0 ? (
          <p className="text-sm text-gray-500">미완료 과업이 없습니다.</p>
        ) : (
          incompleteList.map((it) => (
            <p key={it.assignmentId} className="rounded bg-orange-50 p-2 text-sm text-orange-800">
              {it.date} &apos;{it.taskTitle}&apos; — {it.memberName}
            </p>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">과업 배정</h2>
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
      </section>
    </main>
  );
}
