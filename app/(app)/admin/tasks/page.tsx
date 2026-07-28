import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { isMobileUserAgent } from "@/lib/device";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { TaskEditButton, TaskCreateButton } from "@/components/admin/TaskEditButton";
import { InlineTaskTitle, InlineTaskDescription, TaskHeadcountSelect } from "@/components/admin/TaskInlineFields";
import { deleteTask } from "./actions";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// [관리자/PC] 과업 생성/관리 화면 (PRD 3.4)
export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.role !== "admin") redirect("/");

  const isSuperadmin = await checkIsSuperadmin();
  const teamId = await resolveEffectiveTeamId(member, isSuperadmin);

  const isMobile = isMobileUserAgent(headers().get("user-agent"));
  const from = searchParams.from ?? getTodayDateString();
  const today = getTodayDateString();

  const [tasksRes, skillTagsRes, requiredSkillsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, date, required_headcount")
      .eq("team_id", teamId)
      .gte("date", from)
      .order("date"),
    supabase.from("skill_tags").select("id, name").order("name"), // 모든 팀이 공유하는 전역 스킬 카탈로그
    supabase.from("task_skills").select("task_id, skill_tag_id"),
  ]);

  const tasks = tasksRes.data ?? [];
  const skillTags = skillTagsRes.data ?? [];

  const requiredSkillsByTask = new Map<string, string[]>();
  for (const rs of requiredSkillsRes.data ?? []) {
    const list = requiredSkillsByTask.get(rs.task_id) ?? [];
    list.push(rs.skill_tag_id);
    requiredSkillsByTask.set(rs.task_id, list);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">과업 관리</h1>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">{searchParams.error}</p>
      )}

      <DatePickerField selectedDate={from} today={today} basePath="/admin/tasks" paramName="from" />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">날짜</th>
            <th className="py-2">과업명</th>
            <th className="py-2">요구인원</th>
            <th className="py-2">필수 스킬</th>
            {!isMobile && <th className="py-2" />}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-b align-top">
              <td className="py-2">{t.date}</td>
              <td className="py-2">
                {isMobile ? (
                  <>
                    <p className="font-medium">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                  </>
                ) : (
                  <>
                    <InlineTaskTitle taskId={t.id} title={t.title} />
                    <InlineTaskDescription taskId={t.id} description={t.description} />
                  </>
                )}
              </td>
              <td className="py-2">
                {isMobile ? (
                  `${t.required_headcount}명`
                ) : (
                  <TaskHeadcountSelect taskId={t.id} requiredHeadcount={t.required_headcount} />
                )}
              </td>
              <td className="py-2">
                {(requiredSkillsByTask.get(t.id) ?? [])
                  .map((id) => skillTags.find((s) => s.id === id)?.name)
                  .filter(Boolean)
                  .join(", ") || "-"}
              </td>
              {!isMobile && (
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <TaskEditButton
                      task={t}
                      skillTags={skillTags}
                      requiredSkillIds={requiredSkillsByTask.get(t.id) ?? []}
                    />
                    <form action={deleteTask}>
                      <input type="hidden" name="taskId" value={t.id} />
                      <button type="submit" className="text-xs text-red-600 underline">
                        삭제
                      </button>
                    </form>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={isMobile ? 3 : 4} className="py-4 text-center text-gray-500">
                등록된 과업이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isMobile ? (
        <p className="text-sm text-gray-500">
          과업 생성/삭제 등 변경 작업은 PC에서만 가능합니다 (조회 전용).
        </p>
      ) : (
        <TaskCreateButton skillTags={skillTags} />
      )}
    </main>
  );
}
