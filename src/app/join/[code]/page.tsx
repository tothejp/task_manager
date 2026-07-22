import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { joinTeam } from "./actions";

export default async function JoinTeamPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join/${params.code}`);
  }

  const member = await getCurrentMember();
  if (member) redirect("/");

  const joinTeamWithCode = joinTeam.bind(null, params.code);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">팀 참여하기</h1>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={joinTeamWithCode} className="flex flex-col gap-3">
        <input
          type="text"
          name="memberName"
          placeholder="이름"
          required
          className="rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-white"
        >
          참여하기
        </button>
      </form>
    </main>
  );
}
