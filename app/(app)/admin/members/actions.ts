"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const member = await getCurrentMember();

  if (!user || !member || member.role !== "admin") {
    throw new Error("관리자만 수행할 수 있는 작업입니다.");
  }

  return { supabase, member };
}

export async function approveMember(memberId: string) {
  const { supabase, member } = await requireAdmin();

  await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("team_id", member.team_id);

  revalidatePath("/admin/members");
}

export async function rejectMember(memberId: string) {
  const { supabase, member } = await requireAdmin();

  await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", member.team_id)
    .eq("status", "pending");

  revalidatePath("/admin/members");
}
