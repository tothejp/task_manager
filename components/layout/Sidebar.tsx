"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { ADMIN_NAV_ITEMS, MEMBER_NAV_ITEMS } from "./nav-items";
import { TeamSwitcher } from "@/components/admin/TeamSwitcher";

export function Sidebar({
  role,
  memberName,
  teamName,
  isSuperadmin,
  teams,
  activeTeamId,
}: {
  role: "admin" | "member";
  memberName: string;
  teamName: string;
  isSuperadmin: boolean;
  teams: { id: string; name: string }[];
  activeTeamId: string;
}) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_NAV_ITEMS : MEMBER_NAV_ITEMS;

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-gray-200 bg-white md:w-60">
      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-5 md:px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/task-manager-icon.png" alt="" className="h-8 w-8 shrink-0" />
        <span className="hidden text-base font-bold text-gray-900 md:inline">Task Manager</span>
      </Link>

      <Link
        href="/me"
        className="mx-2 mb-3 flex items-center justify-center rounded-lg px-2.5 py-2 text-center hover:bg-gray-50 md:justify-start md:text-left"
      >
        <p className="hidden truncate text-xs text-gray-500 md:block">
          {teamName} · {memberName}
        </p>
        <User className="h-5 w-5 shrink-0 text-gray-400 md:hidden" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center justify-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium md:justify-start",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-gray-200 px-2 py-3">
        {isSuperadmin && (
          <div className="hidden md:block">
            <TeamSwitcher teams={teams} activeTeamId={activeTeamId} returnTo={pathname} />
          </div>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 md:justify-start"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">로그아웃</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
