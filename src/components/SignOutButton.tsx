import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm text-gray-600 underline">
        로그아웃
      </button>
    </form>
  );
}
