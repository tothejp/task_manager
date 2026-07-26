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

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const taskId = formData.get("taskId") as string;

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    redirect(`/admin/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tasks");
}
