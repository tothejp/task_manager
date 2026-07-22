import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";

// 초대코드로 합류한 팀원이 관리자 승인을 기다리는 화면 (이메일 인증 대체)
export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");
  if (member.status !== "pending") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {member.teams?.name ?? "팀"} 승인 대기 중
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          관리자가 가입을 승인하면 이용하실 수 있습니다. 잠시만 기다려주세요.
        </p>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
