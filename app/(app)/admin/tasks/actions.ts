"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";
import {
  enumerateDailyOccurrences,
  enumerateWeeklyOccurrences,
  enumerateMonthlyOccurrences,
} from "@/lib/date";

const DAILY_REPEAT_OCCURRENCES = 14;
const WEEKLY_REPEAT_OCCURRENCES = 8;
const MONTHLY_REPEAT_OCCURRENCES = 6;

type RepeatType = "none" | "daily" | "weekly" | "monthly";

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

function datesForRepeat(date: string, repeatType: RepeatType): string[] {
  switch (repeatType) {
    case "daily":
      return enumerateDailyOccurrences(date, DAILY_REPEAT_OCCURRENCES);
    case "weekly":
      return enumerateWeeklyOccurrences(date, WEEKLY_REPEAT_OCCURRENCES);
    case "monthly":
      return enumerateMonthlyOccurrences(date, MONTHLY_REPEAT_OCCURRENCES);
    default:
      return [date];
  }
}

export async function createTask(formData: FormData) {
  const { supabase, member } = await requireAdmin();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const requiredHeadcount = Number(formData.get("requiredHeadcount"));
  const repeatType = ((formData.get("repeatType") as string) || "none") as RepeatType;
  const requiredSkillIds = formData.getAll("requiredSkillIds") as string[];

  if (endTime <= startTime) {
    redirect(`/admin/tasks?error=${encodeURIComponent("종료 시각은 시작 시각보다 늦어야 합니다.")}`);
  }

  const dates = datesForRepeat(date, repeatType);

  for (const d of dates) {
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        team_id: member.team_id,
        title,
        description,
        date: d,
        start_time: startTime,
        end_time: endTime,
        required_headcount: requiredHeadcount,
        repeat_type: repeatType === "none" ? null : repeatType,
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
