import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { completeAssignment } from "./actions";

type TaskInfo = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
};

type AssignmentRow = {
  id: string;
  status: "assigned" | "completed";
  tasks: TaskInfo;
};

// [팀원/모바일] 배정 과업 확인 및 완료 체크 화면 (PRD 3.8)
export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.role !== "member") redirect("/");
  if (member.status === "pending") redirect("/pending");

  const { data } = await supabase
    .from("assignments")
    .select("id, status, tasks(id, title, description, date, start_time, end_time)")
    .eq("member_id", member.id)
    .in("status", ["assigned", "completed"]);

  const rows = ((data ?? []) as unknown as AssignmentRow[]).sort((a, b) => {
    const dateCompare = a.tasks.date.localeCompare(b.tasks.date);
    return dateCompare !== 0 ? dateCompare : a.tasks.start_time.localeCompare(b.tasks.start_time);
  });

  const incomplete = rows.filter((r) => r.status === "assigned");
  const completed = rows.filter((r) => r.status === "completed");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">내 임무</h1>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">{searchParams.error}</p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500">미완료</h2>
        {incomplete.length === 0 && (
          <p className="text-sm text-gray-400">미완료 임무가 없습니다.</p>
        )}
        {incomplete.map((r) => (
          <div key={r.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{r.tasks.title}</p>
            <p className="text-xs text-gray-500">
              {r.tasks.date} · {r.tasks.start_time.slice(0, 5)}~{r.tasks.end_time.slice(0, 5)}
            </p>
            {r.tasks.description && (
              <p className="mt-1 text-xs text-gray-500">{r.tasks.description}</p>
            )}
            <form action={completeAssignment.bind(null, r.id)} className="mt-2">
              <button
                type="submit"
                className="rounded bg-black px-3 py-2 text-sm text-white"
              >
                완료 체크
              </button>
            </form>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500">완료</h2>
        {completed.length === 0 && (
          <p className="text-sm text-gray-400">완료한 임무가 없습니다.</p>
        )}
        {completed.map((r) => (
          <div key={r.id} className="rounded border p-3 text-sm text-gray-500">
            <p className="font-medium">✓ {r.tasks.title}</p>
            <p className="text-xs text-gray-400">
              {r.tasks.date} · {r.tasks.start_time.slice(0, 5)}~{r.tasks.end_time.slice(0, 5)}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
