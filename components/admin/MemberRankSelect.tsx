"use client";

import { useTransition } from "react";
import { updateMemberRank } from "@/app/(app)/admin/organization/actions";

const RANKS = ["이병", "일병", "상병", "병장"] as const;

export function MemberRankSelect({ memberId, rank }: { memberId: string; rank: string | null }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={rank ?? ""}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateMemberRank(memberId, e.target.value))}
      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="" disabled>
        계급 선택
      </option>
      {RANKS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
