import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Scale,
  UserCheck,
  CalendarDays,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "중대 현황판", icon: LayoutDashboard },
  { href: "/admin/tasks", label: "과업 관리", icon: ClipboardList },
  { href: "/admin/assign", label: "과업 배정", icon: Users },
  { href: "/admin/fairness", label: "공정성 지표", icon: Scale },
  { href: "/admin/organization", label: "조직원 관리", icon: UserCheck },
];

export const MEMBER_NAV_ITEMS: NavItem[] = [
  { href: "/schedule", label: "내 일정", icon: CalendarDays },
  { href: "/my-tasks", label: "내 임무", icon: ListChecks },
];

// 로그인 화면 + 사이드바 상단에 공용으로 쓰는 브랜드 아이콘
export const BRAND_ICON = ListChecks;
