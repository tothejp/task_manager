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
