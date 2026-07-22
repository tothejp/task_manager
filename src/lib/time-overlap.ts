// 두 시간대가 겹치는지 판단하는 공통 유틸 (CLAUDE.md 2.3)
// Drag & Drop 배정 화면의 하드 차단 로직과 자동배정 로직에서 함께 재사용한다.
// "HH:MM" 또는 "HH:MM:SS" 형식의 24시간제 문자열은 사전식 비교가 시간 비교와
// 그대로 일치하므로 Date 객체로 변환하지 않고 문자열째로 비교한다.
export function isTimeOverlapping(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
