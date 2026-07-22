import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { getCurrentMonth, getAdjacentMonth } from "@/lib/date";
import { ScheduleCalendar, type AvailabilityRow } from "@/components/schedule/ScheduleCalendar";

// [팀원/모바일] 개인 일정 입력 화면 (PRD 3.2)
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");

  // 개인 일정 입력은 팀원 기능이다 (PRD 3.2, CLAUDE.md 2.1 역할-플랫폼 분리 원칙)
  if (member.role !== "MEMBER") redirect("/");

  const month = searchParams.month ?? getCurrentMonth();

  const { data: availabilities } = await supabase
    .from("availabilities")
    .select("date, status, repeat_type")
    .eq("member_id", member.id)
    .gte("date", `${month}-01`)
    .lte("date", `${month}-31`);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">내 일정</h1>
        <Link href="/" className="text-sm underline">
          홈으로
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/schedule?month=${getAdjacentMonth(month, -1)}`} className="px-2 py-1 text-sm">
          ‹ 이전달
        </Link>
        <span className="font-medium">{month}</span>
        <Link href={`/schedule?month=${getAdjacentMonth(month, 1)}`} className="px-2 py-1 text-sm">
          다음달 ›
        </Link>
      </div>

      <ScheduleCalendar month={month} availabilities={(availabilities as AvailabilityRow[]) ?? []} />
    </main>
  );
}
