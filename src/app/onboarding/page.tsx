import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { createTeam } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (member) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">새 팀 만들기</h1>
      <p className="text-sm text-gray-600">
        초대 링크를 받으셨다면 이 화면 대신 받으신 링크로 접속해주세요.
      </p>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={createTeam} className="flex flex-col gap-3">
        <input
          type="text"
          name="teamName"
          placeholder="팀 이름"
          required
          className="rounded border px-3 py-2"
        />
        <input
          type="text"
          name="adminName"
          placeholder="관리자님 성함"
          required
          className="rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-white"
        >
          팀 만들기
        </button>
      </form>
    </main>
  );
}
