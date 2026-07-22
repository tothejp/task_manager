"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/get-current-member";

// assignments 테이블은 관리자만 write 가능(RLS)하므로 SECURITY DEFINER RPC로만 완료 처리한다.
export async function completeAssignment(assignmentId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("로그인이 필요합니다.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_assignment_completed", {
    p_assignment_id: assignmentId,
  });

  if (error) {
    redirect(`/my-tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my-tasks");
}
