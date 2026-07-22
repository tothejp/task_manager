"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { enumerateDateRange, enumerateWeeklyOccurrences } from "@/lib/date";

const WEEKLY_REPEAT_WEEKS = 8;

type AvailabilityStatus = "available" | "vacation" | "dayoff";

async function upsertAvailabilityDates(
  memberId: string,
  dates: string[],
  status: AvailabilityStatus,
  repeatType: "weekly" | null
) {
  const supabase = await createClient();

  for (const date of dates) {
    await supabase
      .from("availabilities")
      .delete()
      .eq("member_id", memberId)
      .eq("start_date", date);

    const { error } = await supabase.from("availabilities").insert({
      member_id: memberId,
      start_date: date,
      end_date: date,
      status,
      repeat_type: repeatType,
    });

    if (error) throw new Error(error.message);
  }
}

export async function setDayStatus(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");

  const date = formData.get("date") as string;
  const status = formData.get("status") as AvailabilityStatus;
  const endDate = (formData.get("endDate") as string) || null;
  const repeatWeekly = formData.get("repeatWeekly") === "on";

  let dates: string[];
  let repeatType: "weekly" | null = null;

  if (status === "vacation" && endDate && endDate > date) {
    dates = enumerateDateRange(date, endDate);
  } else if (status === "dayoff" && repeatWeekly) {
    dates = enumerateWeeklyOccurrences(date, WEEKLY_REPEAT_WEEKS);
    repeatType = "weekly";
  } else {
    dates = [date];
  }

  await upsertAvailabilityDates(member.id, dates, status, repeatType);

  // 휴가 등록 시, 이미 배정된 과업이 있다면 자동으로 공백 상태로 전환한다 (PRD 3.7).
  // 팀원에게는 assignments 테이블 UPDATE 권한이 없으므로 RPC로 처리한다.
  if (status === "vacation") {
    const supabase = await createClient();
    const { error } = await supabase.rpc("apply_vacation_gaps", {
      p_member_id: member.id,
      p_dates: dates,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/schedule");
}

export async function clearDayStatus(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");

  const date = formData.get("date") as string;
  const supabase = await createClient();

  const { error } = await supabase
    .from("availabilities")
    .delete()
    .eq("member_id", member.id)
    .eq("start_date", date);

  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
}
