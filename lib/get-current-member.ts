import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type MemberRank = "이병" | "일병" | "상병" | "병장";

export type CurrentMember = {
  id: string;
  team_id: string;
  role: "admin" | "member";
  status: "active" | "pending";
  rank: MemberRank | null;
  name: string;
  teams: { name: string } | null;
};

// 같은 요청(렌더 1회) 안에서 여러 곳(레이아웃, getCurrentMember 등)이 불러도
// 실제 Supabase Auth 호출은 한 번만 나가도록 React cache로 묶는다.
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const user = await getAuthUser();

  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("id, team_id, role, status, rank, name, teams(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as unknown as CurrentMember | null;
}
