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

// 같은 요청(렌더 1회) 안에서는 레이아웃과 각 페이지가 각자 auth/member 조회를
// 다시 호출해도 실제 Supabase 호출은 한 번만 나가도록 React cache로 묶는다.
// (레이아웃이 이미 조회한 결과를 페이지가 그대로 재사용하게 되는 셈)
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const user = await getAuthUser();

  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("id, team_id, role, status, rank:member_rank, name, teams(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as unknown as CurrentMember | null;
});
