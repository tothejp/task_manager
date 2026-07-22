"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { enumerateDateRange, enumerateWeeklyOccurrences } from "@/lib/date";

// 휴무일 "매주 반복" 등록 시 미리 생성해두는 주 수 (약 2개월)
const WEEKLY_REPEAT_WEEKS = 8;

type AvailabilityStatus = "AVAILABLE" | "VACATION" | "DAY_OFF";

async function upsertAvailabilityDates(
  memberId: string,
  dates: string[],
  status: AvailabilityStatus,
  repeatType: "NONE" | "WEEKLY"
) {
  const supabase = createClient();
  const rows = dates.map((date) => ({
    member_id: memberId,
    date,
    status,
    repeat_type: repeatType,
  }));

  const { error } = await supabase
    .from("availabilities")
    .upsert(rows, { onConflict: "member_id,date" });

  if (error) throw new Error(error.message);
}

// 팀원 본인 일정 등록. 즉시 반영되며 별도 승인 절차가 없다 (PRD 3.2)
export async function setDayStatus(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");

  const date = formData.get("date") as string;
  const status = formData.get("status") as AvailabilityStatus;
  const endDate = (formData.get("endDate") as string) || null;
  const repeatWeekly = formData.get("repeatWeekly") === "on";

  let dates: string[];
  let repeatType: "NONE" | "WEEKLY" = "NONE";

  if (status === "VACATION" && endDate && endDate > date) {
    dates = enumerateDateRange(date, endDate);
  } else if (status === "DAY_OFF" && repeatWeekly) {
    dates = enumerateWeeklyOccurrences(date, WEEKLY_REPEAT_WEEKS);
    repeatType = "WEEKLY";
  } else {
    dates = [date];
  }

  await upsertAvailabilityDates(member.id, dates, status, repeatType);

  // 휴가 등록 시, 이미 배정된 과업이 있다면 자동으로 "공백" 상태로 전환한다 (PRD 3.7).
  // 팀원에게는 assignments 테이블 UPDATE 권한이 없으므로 RPC로 처리한다.
  if (status === "VACATION") {
    const supabase = createClient();
    const { error } = await supabase.rpc("apply_vacation_gaps", { p_dates: dates });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/schedule");
}

export async function clearDayStatus(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");

  const date = formData.get("date") as string;
  const supabase = createClient();

  const { error } = await supabase
    .from("availabilities")
    .delete()
    .eq("member_id", member.id)
    .eq("date", date);

  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
}
