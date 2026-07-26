import { redirect } from "next/navigation";
import { getAuthUser, getCurrentMember } from "@/lib/get-current-member";

const ROLE_LABELS = { admin: "관리자", member: "팀원" } as const;

// [공용] 현재 로그인한 사용자의 이름/소속/역할/계정 정보
export default async function MePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const member = await getCurrentMember();
  if (!member) redirect("/onboarding");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">내 정보</h1>

      <div className="flex flex-col divide-y rounded border">
        <Field label="이름" value={member.name} />
        <Field label="계급" value={member.rank ?? "미지정"} />
        <Field label="소속" value={member.teams?.name ?? "-"} />
        <Field label="역할" value={ROLE_LABELS[member.role]} />
        <Field label="계정" value={user.email ?? "-"} />
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
