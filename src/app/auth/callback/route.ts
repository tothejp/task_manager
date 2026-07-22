import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 이메일 인증 링크(PKCE code)를 세션으로 교환한다
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
