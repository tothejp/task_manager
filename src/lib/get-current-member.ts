import { createClient } from "@/lib/supabase/server";

export type CurrentMember = {
  id: string;
  team_id: string;
  role: "ADMIN" | "MEMBER";
  name: string;
  teams: { name: string; invite_code: string } | null;
};

// 로그인한 사용자의 member 행(+소속 팀)을 조회한다.
// Supabase 클라이언트(RLS 적용)로 조회하므로, 팀이 없는 사용자는 null을 반환한다.
// 주의: Prisma는 DATABASE_URL 고정 자격 증명으로 연결되어 RLS를 우회하므로
// 사용자별 데이터 조회에는 사용하지 않는다. 런타임 조회는 이 Supabase 클라이언트를,
// Prisma는 스키마/마이그레이션 관리 용도로만 사용한다.
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select("id, team_id, role, name, teams(name, invite_code)")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as unknown as CurrentMember | null;
}
