import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">회원가입</h1>

      {searchParams.error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-3">
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
          placeholder="비밀번호 (6자 이상)"
          required
          minLength={6}
          className="rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-white"
        >
          회원가입
        </button>
      </form>

      <p className="text-sm text-gray-600">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
