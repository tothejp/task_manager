import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { CurrentMember } from "@/lib/get-current-member";

export const ACTIVE_TEAM_COOKIE = "active_team_id";

// getCurrentMember처럼 요청 단위로 캐싱 — 레이아웃(AppShell)과 각 페이지가
// 같은 요청 안에서 각자 호출해도 Supabase RPC/쿼리는 한 번만 나간다.
export const checkIsSuperadmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_superadmin");
  return !!data;
});

// 슈퍼관리자가 팀 전환 쿠키로 다른 팀을 보고 있으면 그 팀 id를, 아니면 본인 소속 팀 id를 반환한다.
// member는 getCurrentMember()(캐싱됨)에서 받은 참조를 그대로 넘겨야 캐시가 히트한다.
export const resolveEffectiveTeamId = cache(async (
  member: CurrentMember,
  isSuperadmin: boolean
): Promise<string> => {
  if (!isSuperadmin) return member.team_id;

  const cookieStore = await cookies();
  const override = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value;
  if (!override) return member.team_id;

  const supabase = await createClient();
  const { data: team } = await supabase.from("teams").select("id").eq("id", override).maybeSingle();
  return team ? team.id : member.team_id;
});

// 슈퍼관리자만 호출 (RLS가 이미 전체 팀 조회를 허용하지만, 이 함수는 관리자 화면 전용이므로 그대로 사용)
export async function listAllTeamsForSuperadmin(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("id, name").order("name");
  return data ?? [];
}
