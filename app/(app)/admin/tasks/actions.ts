"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";

// 과업은 시간 단위가 아닌 날짜 단위로만 관리한다 (관리자 요청). DB 컬럼은 not null이라
// 하루 전체를 뜻하는 고정값을 채워 넣는다.
const FULL_DAY_START = "00:00";
const FULL_DAY_END = "23:59";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const member = await getCurrentMember();

  if (!user || !member || member.role !== "admin") {
    throw new Error("관리자만 수행할 수 있는 작업입니다.");
  }

  const isSuperadmin = await checkIsSuperadmin();
  const teamId = await resolveEffectiveTeamId(member, isSuperadmin);

  return { supabase, member: { ...member, team_id: teamId } };
}

export async function createTask(formData: FormData) {
  const { supabase, member } = await requireAdmin();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;
  const requiredHeadcount = Number(formData.get("requiredHeadcount"));
  const requiredSkillIds = formData.getAll("requiredSkillIds") as string[];

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      team_id: member.team_id,
      title,
      description,
      date,
      start_time: FULL_DAY_START,
      end_time: FULL_DAY_END,
      required_headcount: requiredHeadcount,
    })
    .select("id")
    .single();

  if (error || !task) {
    redirect(
      `/admin/tasks?error=${encodeURIComponent(error?.message ?? "과업 생성에 실패했습니다.")}`
    );
  }

  if (requiredSkillIds.length > 0) {
    const rows = requiredSkillIds.map((skillTagId) => ({
      task_id: task.id,
      skill_tag_id: skillTagId,
    }));
    const { error: skillError } = await supabase.from("task_skills").insert(rows);

    if (skillError) {
      redirect(`/admin/tasks?error=${encodeURIComponent(skillError.message)}`);
    }
  }

  revalidatePath("/admin/tasks");
}

export async function updateTask(formData: FormData) {
  const { supabase, member } = await requireAdmin();

  const taskId = formData.get("taskId") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;
  const requiredHeadcount = Number(formData.get("requiredHeadcount"));
  const requiredSkillIds = formData.getAll("requiredSkillIds") as string[];

  const { error } = await supabase
    .from("tasks")
    .update({ title, description, date, required_headcount: requiredHeadcount })
    .eq("id", taskId)
    .eq("team_id", member.team_id);

  if (error) {
    redirect(`/admin/tasks?error=${encodeURIComponent(error.message)}`);
  }

  const { error: clearError } = await supabase.from("task_skills").delete().eq("task_id", taskId);
  if (clearError) {
    redirect(`/admin/tasks?error=${encodeURIComponent(clearError.message)}`);
  }

  if (requiredSkillIds.length > 0) {
    const rows = requiredSkillIds.map((skillTagId) => ({ task_id: taskId, skill_tag_id: skillTagId }));
    const { error: skillError } = await supabase.from("task_skills").insert(rows);
    if (skillError) {
      redirect(`/admin/tasks?error=${encodeURIComponent(skillError.message)}`);
    }
  }

  revalidatePath("/admin/tasks");
}

export type TaskActionResult = { ok: true } | { ok: false; error: string };

// 표에서 과업명/설명/요구인원을 개별적으로 바로 수정할 때 쓰는 경량 액션들
// (전체 수정 모달과 별개로, 클릭 한 번으로 빠르게 고칠 수 있도록 추가)
export async function updateTaskTitle(taskId: string, title: string): Promise<TaskActionResult> {
  const { supabase, member } = await requireAdmin();

  const { error } = await supabase
    .from("tasks")
    .update({ title })
    .eq("id", taskId)
    .eq("team_id", member.team_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tasks");
  return { ok: true };
}

export async function updateTaskDescription(
  taskId: string,
  description: string
): Promise<TaskActionResult> {
  const { supabase, member } = await requireAdmin();

  const { error } = await supabase
    .from("tasks")
    .update({ description: description || null })
    .eq("id", taskId)
    .eq("team_id", member.team_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tasks");
  return { ok: true };
}

export async function updateTaskHeadcount(
  taskId: string,
  requiredHeadcount: number
): Promise<TaskActionResult> {
  const { supabase, member } = await requireAdmin();

  const { error } = await supabase
    .from("tasks")
    .update({ required_headcount: requiredHeadcount })
    .eq("id", taskId)
    .eq("team_id", member.team_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tasks");
  return { ok: true };
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const taskId = formData.get("taskId") as string;

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    redirect(`/admin/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tasks");
}
