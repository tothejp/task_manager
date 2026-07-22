import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { isMobileUserAgent } from "@/lib/device";
import { createTask, deleteTask } from "./actions";

const REPEAT_LABELS: Record<string, string> = {
  NONE: "없음",
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
};

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// [관리자/PC] 과업 생성/관리 화면 (PRD 3.4)
export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.role !== "ADMIN") redirect("/");

  const isMobile = isMobileUserAgent(headers().get("user-agent"));
  const from = searchParams.from ?? getTodayDateString();

  const [tasksRes, skillTagsRes, requiredSkillsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, date, start_time, end_time, required_headcount, repeat_type")
      .eq("team_id", member.team_id)
      .gte("date", from)
      .order("date")
      .order("start_time"),
    supabase.from("skill_tags").select("id, name").eq("team_id", member.team_id).order("name"),
    supabase.from("task_required_skills").select("task_id, skill_tag_id"),
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">과업 관리</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin" className="underline">
            가용인원 대시보드
          </Link>
          <Link href="/admin/assign" className="underline">
            과업 배정
          </Link>
          <Link href="/" className="underline">
            홈으로
          </Link>
        </div>
      </div>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">{searchParams.error}</p>
      )}

      <form className="flex items-end gap-3" method="get">
        <label className="flex flex-col text-sm">
          기준일(이후)
          <input type="date" name="from" defaultValue={from} className="rounded border px-2 py-1" />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
          조회
        </button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">날짜</th>
            <th className="py-2">시간</th>
            <th className="py-2">과업명</th>
            <th className="py-2">요구인원</th>
            <th className="py-2">필수 스킬</th>
            <th className="py-2">반복</th>
            {!isMobile && <th className="py-2" />}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-b align-top">
              <td className="py-2">{t.date}</td>
              <td className="py-2">
                {t.start_time?.slice(0, 5)}~{t.end_time?.slice(0, 5)}
              </td>
              <td className="py-2">
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
              </td>
              <td className="py-2">{t.required_headcount}명</td>
              <td className="py-2">
                {(requiredSkillsByTask.get(t.id) ?? [])
                  .map((id) => skillTags.find((s) => s.id === id)?.name)
                  .filter(Boolean)
                  .join(", ") || "-"}
              </td>
              <td className="py-2">{REPEAT_LABELS[t.repeat_type] ?? t.repeat_type}</td>
              {!isMobile && (
                <td className="py-2">
                  <form action={deleteTask}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <button type="submit" className="text-xs text-red-600 underline">
                      삭제
                    </button>
                  </form>
                </td>
              )}
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={isMobile ? 6 : 7} className="py-4 text-center text-gray-500">
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
        <TaskForm skillTags={skillTags} />
      )}
    </main>
  );
}

function TaskForm({ skillTags }: { skillTags: { id: string; name: string }[] }) {
  return (
    <form action={createTask} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-medium">새 과업 만들기</h2>

      <input
        type="text"
        name="title"
        placeholder="과업 이름"
        required
        className="rounded border px-2 py-1 text-sm"
      />
      <textarea
        name="description"
        placeholder="설명(선택)"
        className="rounded border px-2 py-1 text-sm"
      />

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col text-sm">
          날짜
          <input type="date" name="date" required className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          시작 시각
          <input type="time" name="startTime" required className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          종료 시각
          <input type="time" name="endTime" required className="rounded border px-2 py-1" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col text-sm">
          요구 인원수
          <input
            type="number"
            name="requiredHeadcount"
            min={1}
            defaultValue={1}
            required
            className="w-24 rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          반복 주기
          <select name="repeatType" defaultValue="NONE" className="rounded border px-2 py-1">
            <option value="NONE">없음</option>
            <option value="DAILY">매일 (2주간)</option>
            <option value="WEEKLY">매주 (8주간)</option>
            <option value="MONTHLY">매월 (6개월간)</option>
          </select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="mb-1 font-medium">필수 스킬(선택, 복수 가능)</legend>
        <div className="flex flex-wrap gap-3">
          {skillTags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1">
              <input type="checkbox" name="requiredSkillIds" value={tag.id} />
              {tag.name}
            </label>
          ))}
          {skillTags.length === 0 && (
            <span className="text-xs text-gray-400">등록된 스킬 태그가 없습니다.</span>
          )}
        </div>
      </fieldset>

      <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
        과업 만들기
      </button>
    </form>
  );
}
