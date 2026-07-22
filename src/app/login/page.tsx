import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">로그인</h1>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={login} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={searchParams.next ?? "/"} />
        <input
          type="email"
          name="email"
          placeholder="이메일"
          required
          className="rounded border px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          required
          className="rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-white"
        >
          로그인
        </button>
      </form>

      <p className="text-sm text-gray-600">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
