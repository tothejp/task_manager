"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_TEAM_COOKIE } from "@/lib/team-context";

export async function setActiveTeam(formData: FormData) {
  const supabase = await createClient();
  const { data: isSuperadmin } = await supabase.rpc("is_superadmin");
  if (!isSuperadmin) throw new Error("권한이 없습니다.");

  const teamId = formData.get("teamId") as string;
  const returnTo = (formData.get("returnTo") as string) || "/admin";
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, { httpOnly: true, sameSite: "lax", path: "/" });

  redirect(returnTo);
}
