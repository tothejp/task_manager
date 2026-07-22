import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { SignOutButton } from "@/components/SignOutButton";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">{member.teams?.name}</h1>
        <p className="text-sm text-gray-600">
          {member.name}님 ({member.role === "ADMIN" ? "관리자" : "팀원"})
        </p>
      </div>

      {member.role === "ADMIN" && member.teams && (
        <div className="rounded border p-3 text-sm">
          <p className="mb-1 font-medium">구성원 초대 링크</p>
          <code className="break-all text-gray-700">
            {process.env.NEXT_PUBLIC_SITE_URL}/join/{member.teams.invite_code}
          </code>
        </div>
      )}

      {member.role === "MEMBER" && (
        <Link href="/schedule" className="rounded bg-black px-3 py-2 text-center text-white">
          내 일정 입력
        </Link>
      )}

      {member.role === "ADMIN" && (
        <Link href="/admin" className="rounded bg-black px-3 py-2 text-center text-white">
          가용인원 대시보드
        </Link>
      )}

      <SignOutButton />
    </main>
  );
}
