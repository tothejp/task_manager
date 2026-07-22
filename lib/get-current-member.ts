import { createClient } from "@/lib/supabase/server";

export type CurrentMember = {
  id: string;
  team_id: string;
  role: "admin" | "member";
  status: "active" | "pending";
  name: string;
  teams: { name: string } | null;
};

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select("id, team_id, role, status, name, teams(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as unknown as CurrentMember | null;
}
