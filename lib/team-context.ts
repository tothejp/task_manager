import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { CurrentMember } from "@/lib/get-current-member";

export const ACTIVE_TEAM_COOKIE = "active_team_id";

export async function checkIsSuperadmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_superadmin");
  return !!data;
}

// 슈퍼관리자가 팀 전환 쿠키로 다른 팀을 보고 있으면 그 팀 id를, 아니면 본인 소속 팀 id를 반환한다.
export async function resolveEffectiveTeamId(
  member: CurrentMember,
  isSuperadmin: boolean
): Promise<string> {
  if (!isSuperadmin) return member.team_id;

  const cookieStore = await cookies();
  const override = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value;
  if (!override) return member.team_id;

  const supabase = await createClient();
  const { data: team } = await supabase.from("teams").select("id").eq("id", override).maybeSingle();
  return team ? team.id : member.team_id;
}

// 슈퍼관리자만 호출 (RLS가 이미 전체 팀 조회를 허용하지만, 이 함수는 관리자 화면 전용이므로 그대로 사용)
export async function listAllTeamsForSuperadmin(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("id, name").order("name");
  return data ?? [];
}
