import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

// Supabase 세션 쿠키를 매 요청마다 갱신한다.
// 역할/디바이스에 따른 화면 제한은 각 페이지(서버 컴포넌트)에서 처리한다.
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
