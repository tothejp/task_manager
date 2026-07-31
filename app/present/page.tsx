import type { Metadata } from "next";
import { deckHtml } from "./deck";

export const metadata: Metadata = {
  title: "임무분담표 TaskShare — 소개 자료",
  description: "임무분담표(TaskShare) 프로젝트 소개 및 시연용 발표 자료",
};

// 발표/시연용 공개 페이지 — 로그인 없이 누구나 볼 수 있다 ((app)/(auth) 그룹 밖이라 인증 체크 없음).
// 앱 전역 스타일과 완전히 분리된 독립 문서라 iframe srcDoc으로 그대로 띄운다.
export default function PresentPage() {
  return (
    <iframe
      srcDoc={deckHtml}
      title="임무분담표 TaskShare 소개 자료"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
