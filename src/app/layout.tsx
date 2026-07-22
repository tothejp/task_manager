import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { getCurrentMember } from "@/lib/get-current-member";
import { isMobileUserAgent } from "@/lib/device";
import { DeviceNotice } from "@/components/DeviceNotice";

export const metadata: Metadata = {
  title: "임무분담표 (TaskShare)",
  description: "소규모 팀을 위한 역할 분리형 임무 분담 관리 앱",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  const isMobile = isMobileUserAgent(headers().get("user-agent"));

  let notice: string | null = null;
  if (member?.role === "MEMBER" && !isMobile) {
    notice = "팀원은 모바일에서 이용해주세요. PC에서는 일부 화면이 제한될 수 있습니다.";
  } else if (member?.role === "ADMIN" && isMobile) {
    notice = "모바일에서는 조회만 가능합니다. 배정·생성 등 변경 작업은 PC에서 이용해주세요.";
  }

  return (
    <html lang="ko">
      <body>
        {notice && <DeviceNotice message={notice} />}
        {children}
      </body>
    </html>
  );
}
