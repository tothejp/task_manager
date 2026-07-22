"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const member = await getCurrentMember();

  if (!user || !member || member.role !== "ADMIN") {
    throw new Error("관리자만 수행할 수 있는 작업입니다.");
  }

  return { supabase, member, userId: user.id };
}

// 팀별 스킬 태그 생성 (PRD 3.1: 스킬 태그는 관리자만 부여/회수 가능)
export async function createSkillTag(formData: FormData) {
  const { supabase, member } = await requireAdmin();
  const skillName = formData.get("skillName") as string;

  const { error } = await supabase
    .from("skill_tags")
    .insert({ team_id: member.team_id, name: skillName });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
}

export async function grantSkill(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const memberId = formData.get("memberId") as string;
  const skillTagId = formData.get("skillTagId") as string;

  const { error } = await supabase
    .from("member_skills")
    .insert({ member_id: memberId, skill_tag_id: skillTagId, granted_by: userId });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
}

export async function revokeSkill(formData: FormData) {
  const { supabase } = await requireAdmin();
  const memberId = formData.get("memberId") as string;
  const skillTagId = formData.get("skillTagId") as string;

  const { error } = await supabase
    .from("member_skills")
    .delete()
    .eq("member_id", memberId)
    .eq("skill_tag_id", skillTagId);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
}
