// 요구인원 0은 "제한없음"을 뜻하는 특수값이다 (0명을 요구하는 과업은 실제로 없으므로 안전하게 재사용).
export const UNLIMITED_HEADCOUNT = 0;

export function isUnlimitedHeadcount(requiredHeadcount: number): boolean {
  return requiredHeadcount === UNLIMITED_HEADCOUNT;
}

export function formatHeadcount(requiredHeadcount: number): string {
  return isUnlimitedHeadcount(requiredHeadcount) ? "제한없음" : `${requiredHeadcount}명`;
}
