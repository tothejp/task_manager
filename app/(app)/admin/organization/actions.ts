"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";
import { checkIsSuperadmin, resolveEffectiveTeamId } from "@/lib/team-context";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const member = await getCurrentMember();

  if (!user || !member || member.role !== "admin") {
    throw new Error("관리자만 수행할 수 있는 작업입니다.");
  }

  const isSuperadmin = await checkIsSuperadmin();
  const teamId = await resolveEffectiveTeamId(member, isSuperadmin);

  return { supabase, member: { ...member, team_id: teamId } };
}

// 가입 승인 대기 팀원 승인/거부 (이메일 인증 대체)
export async function approveMember(memberId: string) {
  const { supabase, member } = await requireAdmin();

  await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("team_id", member.team_id);

  revalidatePath("/admin/organization");
}

export async function rejectMember(memberId: string) {
  const { supabase, member } = await requireAdmin();

  await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", member.team_id)
    .eq("status", "pending");

  revalidatePath("/admin/organization");
}

// 팀별 스킬 태그 생성 (PRD 3.1: 스킬 태그는 관리자만 부여/회수 가능)
export async function createSkillTag(formData: FormData) {
  const { supabase, member } = await requireAdmin();
  const skillName = formData.get("skillName") as string;

  const { error } = await supabase
    .from("skill_tags")
    .insert({ team_id: member.team_id, name: skillName });

  if (error) {
    const message =
      error.code === "23505" ? `이미 등록된 스킬 태그입니다: ${skillName}` : error.message;
    redirect(`/admin/organization?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/organization");
}

export type SkillActionResult = { ok: true } | { ok: false; error: string };

// Drag & Drop으로 스킬 태그를 조직원에게 끌어다 놓으면 호출된다 (클라이언트에서 직접 호출)
export async function grantSkill(memberId: string, skillTagId: string): Promise<SkillActionResult> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("member_skills")
    .insert({ member_id: memberId, skill_tag_id: skillTagId });

  if (error) {
    return { ok: false, error: error.code === "23505" ? "이미 보유한 스킬입니다." : error.message };
  }

  revalidatePath("/admin/organization");
  return { ok: true };
}

export async function revokeSkill(memberId: string, skillTagId: string): Promise<SkillActionResult> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("member_skills")
    .delete()
    .eq("member_id", memberId)
    .eq("skill_tag_id", skillTagId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/organization");
  return { ok: true };
}

// 계급 지정/변경 (이병/일병/상병/병장)
export async function updateMemberRank(memberId: string, rank: string) {
  const { supabase, member } = await requireAdmin();

  const { error } = await supabase
    .from("members")
    .update({ member_rank: rank })
    .eq("id", memberId)
    .eq("team_id", member.team_id);

  if (error) {
    redirect(`/admin/organization?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/organization");
}
