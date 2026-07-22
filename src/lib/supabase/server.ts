import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버 컴포넌트/라우트 핸들러에서 사용하는 Supabase 클라이언트
// 로그인한 사용자 세션의 RLS 컨텍스트로 쿼리하므로, 팀 단위 데이터 격리는
// anon key + RLS 정책 조합으로 강제된다 (service role key는 여기서 사용하지 않는다)
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
