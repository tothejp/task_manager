"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTeam(formData: FormData) {
  const supabase = createClient();
  const teamName = formData.get("teamName") as string;
  const adminName = formData.get("adminName") as string;

  const { error } = await supabase.rpc("create_team_with_admin", {
    p_team_name: teamName,
    p_admin_name: adminName,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
