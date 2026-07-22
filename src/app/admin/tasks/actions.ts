"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import {
  enumerateDailyOccurrences,
  enumerateWeeklyOccurrences,
  enumerateMonthlyOccurrences,
} from "@/lib/date";

// 반복 과업 생성 시 미리 만들어두는 발생 횟수 (매직 넘버 회피용 상수)
const DAILY_REPEAT_OCCURRENCES = 14; // 2주
const WEEKLY_REPEAT_OCCURRENCES = 8; // 약 2개월
const MONTHLY_REPEAT_OCCURRENCES = 6; // 6개월

type RepeatType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

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

function datesForRepeat(date: string, repeatType: RepeatType): string[] {
  switch (repeatType) {
    case "DAILY":
      return enumerateDailyOccurrences(date, DAILY_REPEAT_OCCURRENCES);
    case "WEEKLY":
      return enumerateWeeklyOccurrences(date, WEEKLY_REPEAT_OCCURRENCES);
    case "MONTHLY":
      return enumerateMonthlyOccurrences(date, MONTHLY_REPEAT_OCCURRENCES);
    default:
      return [date];
  }
}

// 과업 생성. 반복 주기가 지정되면 정해진 기간만큼 실제 행을 미리 생성한다
// (availabilities와 동일한 방식 — src/lib/date.ts 참고)
export async function createTask(formData: FormData) {
  const { supabase, member } = await requireAdmin();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const requiredHeadcount = Number(formData.get("requiredHeadcount"));
  const repeatType = ((formData.get("repeatType") as string) || "NONE") as RepeatType;
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
        repeat_type: repeatType,
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
      const { error: skillError } = await supabase.from("task_required_skills").insert(rows);

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
