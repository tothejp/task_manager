// CLAUDE.md 2.1: 공격적으로 차단하지 않고 안내 메시지 정도로만 사용한다.
const MOBILE_UA_REGEX = /Android|iPhone|iPad|iPod|Mobile/i;

export function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return MOBILE_UA_REGEX.test(userAgent);
}
