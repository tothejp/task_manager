"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinTeam(inviteCode: string, formData: FormData) {
  const supabase = createClient();
  const memberName = formData.get("memberName") as string;

  const { error } = await supabase.rpc("join_team_with_invite_code", {
    p_invite_code: inviteCode,
    p_member_name: memberName,
  });

  if (error) {
    redirect(`/join/${inviteCode}?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
