"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { isTimeOverlapping } from "@/lib/time-overlap";
import {
  recommendAssignments,
  type AutoAssignMember,
  type AutoAssignTask,
  type AutoAssignResult,
} from "@/lib/auto-assign";

type SupabaseServerClient = ReturnType<typeof createClient>;

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const member = await getCurrentMember();

  if (!user || !member || member.role !== "ADMIN") {
    throw new Error("관리자만 수행할 수 있는 작업입니다.");
  }

  return { supabase, member };
}

export type AssignResult = { ok: true } | { ok: false; error: string };

// 시간 중복(하드 차단) + 요구 인원 초과를 서버에서 재검증한 뒤 배정을 기록한다.
// D&D 수동 배정과 자동배정 확정이 이 검증 로직을 공유한다 (CLAUDE.md 2.3).
async function insertAssignmentIfValid(
  supabase: SupabaseServerClient,
  teamId: string,
  taskId: string,
  memberId: string,
  skillOverride: boolean,
  assignedBy: "MANUAL" | "AUTO"
): Promise<AssignResult> {
  const { data: task } = await supabase
    .from("tasks")
    .select("id, date, start_time, end_time, required_headcount, team_id")
    .eq("id", taskId)
    .single();

  if (!task || task.team_id !== teamId) {
    return { ok: false, error: "과업을 찾을 수 없습니다." };
  }

  const { data: sameDayAssignments } = await supabase
    .from("assignments")
    .select("task_id")
    .eq("member_id", memberId)
    .eq("date", task.date)
    .neq("status", "EMPTY");

  const otherTaskIds = (sameDayAssignments ?? [])
    .map((a) => a.task_id)
    .filter((id) => id !== taskId);

  if (otherTaskIds.length > 0) {
    const { data: otherTasks } = await supabase
      .from("tasks")
      .select("id, title, start_time, end_time")
      .in("id", otherTaskIds);

    const conflict = (otherTasks ?? []).find((t) =>
      isTimeOverlapping(t.start_time, t.end_time, task.start_time, task.end_time)
    );

    if (conflict) {
      return {
        ok: false,
        error: `이미 ${conflict.start_time.slice(0, 5)}~${conflict.end_time.slice(0, 5)}에 '${conflict.title}'에 배정되어 있어 배정할 수 없습니다.`,
      };
    }
  }

  const { count } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId)
    .neq("status", "EMPTY");

  if ((count ?? 0) >= task.required_headcount) {
    return { ok: false, error: "요구 인원이 모두 채워졌습니다." };
  }

  const { error } = await supabase.from("assignments").insert({
    task_id: taskId,
    member_id: memberId,
    date: task.date,
    status: "ASSIGNED",
    assigned_by: assignedBy,
    skill_override: skillOverride,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function assignMember(
  taskId: string,
  memberId: string,
  skillOverride: boolean
): Promise<AssignResult> {
  const { supabase, member } = await requireAdmin();
  const result = await insertAssignmentIfValid(
    supabase,
    member.team_id,
    taskId,
    memberId,
    skillOverride,
    "MANUAL"
  );

  if (result.ok) revalidatePath("/admin/assign");
  return result;
}

export async function unassignMember(assignmentId: string) {
  const { supabase } = await requireAdmin();

  await supabase.from("assignments").delete().eq("id", assignmentId);

  revalidatePath("/admin/assign");
}

// 자동배정 추천 계산 (미리보기 전용, DB에는 아무것도 기록하지 않는다 — PRD 3.6)
export async function getAutoAssignRecommendations(date: string): Promise<AutoAssignResult> {
  const { supabase, member } = await requireAdmin();

  const [membersRes, availRes, memberSkillsRes, tasksRes, requiredSkillsRes, dayAssignmentsRes, allAssignmentsRes] =
    await Promise.all([
      supabase.from("members").select("id, name").eq("team_id", member.team_id),
      supabase.from("availabilities").select("member_id, status").eq("date", date),
      supabase.from("member_skills").select("member_id, skill_tag_id"),
      supabase
        .from("tasks")
        .select("id, title, start_time, end_time, required_headcount")
        .eq("team_id", member.team_id)
        .eq("date", date),
      supabase.from("task_required_skills").select("task_id, skill_tag_id"),
      supabase.from("assignments").select("task_id, member_id").eq("date", date).neq("status", "EMPTY"),
      supabase.from("assignments").select("member_id, date").in("status", ["ASSIGNED", "COMPLETED"]),
    ]);

  const statusByMember = new Map((availRes.data ?? []).map((a) => [a.member_id, a.status]));

  const skillsByMember = new Map<string, string[]>();
  for (const ms of memberSkillsRes.data ?? []) {
    const list = skillsByMember.get(ms.member_id) ?? [];
    list.push(ms.skill_tag_id);
    skillsByMember.set(ms.member_id, list);
  }

  const workloadByMember = new Map<string, number>();
  const lastDateByMember = new Map<string, string>();
  for (const a of allAssignmentsRes.data ?? []) {
    workloadByMember.set(a.member_id, (workloadByMember.get(a.member_id) ?? 0) + 1);
    const prev = lastDateByMember.get(a.member_id);
    if (!prev || a.date > prev) lastDateByMember.set(a.member_id, a.date);
  }

  const tasksByIdForDate = new Map((tasksRes.data ?? []).map((t) => [t.id, t]));

  const existingSlotsByMember = new Map<string, { startTime: string; endTime: string }[]>();
  const assignedByTask = new Map<string, string[]>();
  for (const a of dayAssignmentsRes.data ?? []) {
    const t = tasksByIdForDate.get(a.task_id);
    if (!t) continue;

    const slots = existingSlotsByMember.get(a.member_id) ?? [];
    slots.push({ startTime: t.start_time, endTime: t.end_time });
    existingSlotsByMember.set(a.member_id, slots);

    const assignedList = assignedByTask.get(a.task_id) ?? [];
    assignedList.push(a.member_id);
    assignedByTask.set(a.task_id, assignedList);
  }

  const availableMembers: AutoAssignMember[] = (membersRes.data ?? [])
    .filter((m) => (statusByMember.get(m.id) ?? "AVAILABLE") === "AVAILABLE")
    .map((m) => ({
      id: m.id,
      skillIds: skillsByMember.get(m.id) ?? [],
      workloadCount: workloadByMember.get(m.id) ?? 0,
      lastAssignedDate: lastDateByMember.get(m.id) ?? null,
      existingSlotsToday: existingSlotsByMember.get(m.id) ?? [],
    }));

  const requiredSkillsByTask = new Map<string, string[]>();
  for (const rs of requiredSkillsRes.data ?? []) {
    const list = requiredSkillsByTask.get(rs.task_id) ?? [];
    list.push(rs.skill_tag_id);
    requiredSkillsByTask.set(rs.task_id, list);
  }

  const tasks: AutoAssignTask[] = (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    startTime: t.start_time,
    endTime: t.end_time,
    requiredHeadcount: t.required_headcount,
    requiredSkillIds: requiredSkillsByTask.get(t.id) ?? [],
    assignedMemberIds: assignedByTask.get(t.id) ?? [],
  }));

  return recommendAssignments(tasks, availableMembers);
}

// 자동배정 확정: 미리보기에서 관리자가 최종 확인한 추천만 일괄 반영한다 (PRD 3.6)
export async function confirmAutoAssignments(
  items: { taskId: string; memberId: string }[]
): Promise<{ ok: true; failedCount: number }> {
  const { supabase, member } = await requireAdmin();

  let failedCount = 0;
  for (const item of items) {
    const result = await insertAssignmentIfValid(
      supabase,
      member.team_id,
      item.taskId,
      item.memberId,
      false,
      "AUTO"
    );
    if (!result.ok) failedCount++;
  }

  revalidatePath("/admin/assign");
  return { ok: true, failedCount };
}
