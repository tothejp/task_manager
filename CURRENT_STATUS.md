# CURRENT_STATUS.md — 임무분담표(TaskShare) 진행 상황

마지막 업데이트: 2026-07-22

## 현재 단계: 1~9단계 기능 구현 완료, 전체 흐름 테스트 및 운영 확인 남음

---

## 완료된 작업

### 기능 구현 (1~9단계)
- [x] PRD v0.5 확정 (`task_manager_PRD.md`)
- [x] Prisma 스키마 작성 (`prisma/schema.prisma`) — 소문자 enum, start_date/end_date, task_skills, assignments date 컬럼 없음
- [x] Supabase 클라이언트 초기화 (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [x] RLS 정책 SQL (`supabase/rls_policies.sql`) — 팀 단위 격리, 관리자/팀원 권한 분리
- [x] 인증 페이지 — `/login`, `/signup`, `/signup/check-email`, `/auth/callback`
- [x] 팀 생성/초대 — `/onboarding`, `/join`, SECURITY DEFINER RPC 함수
- [x] 팀원 일정 입력 — `/schedule`, 월간 캘린더, 가용/휴가/휴무 등록
- [x] 관리자 대시보드 — `/admin`, 가용인원 현황, 스킬 태그 관리
- [x] 과업 관리 — `/admin/tasks`, 반복 과업 생성/삭제
- [x] D&D 배정 화면 — `/admin/assign`, 시간 중복 차단, 스킬 경고 모달
- [x] 자동배정 — 순수 함수 `recommendAssignments()`, 미리보기→확정 플로우
- [x] 휴가→재배정 (PRD 3.7) — `schedule/actions.ts`에서 휴가 등록 시 `apply_vacation_gaps` RPC 호출, `/admin/assign`에 공백 알림 표시 후 기존 자동배정으로 재배정
- [x] 완료 체크 (PRD 3.8) — `/my-tasks`(팀원/모바일)에서 `mark_assignment_completed` RPC 호출, `/admin`에 미완료 과업 강조 및 월별 완료율 표시
- [x] 공정성 지표 시각화 (PRD 3.9) — `/admin/fairness`, 구성원별 누적 배정 막대그래프, 평균 대비 ±20% 편차 경고 (`FAIRNESS_DEVIATION_THRESHOLD` 상수)
- [x] 공통 유틸 — `isTimeOverlapping()`, `lib/date.ts`, `lib/device.ts`, `lib/auto-assign.ts`

### 운영 배포
- [x] Vercel 배포 완료 — https://task-manager-rosy-theta.vercel.app
- [x] Supabase DB 테이블 생성 완료 (프로젝트: ewlktlbykhibiiqyxdor)
- [x] RLS 정책 및 SECURITY DEFINER 함수 Supabase에 적용 완료
- [x] Supabase Auth URL Configuration 설정 완료
- [x] Vercel 환경변수 설정 중 (DATABASE_URL, DIRECT_URL 입력 진행 중)

### 주요 버그 수정 이력
- tsconfig.json `@/*` 경로가 `./src/*`로 잘못 설정되어 있던 것 수정 (→ `./*`)
- git rebase로 병합된 claude/ 프로젝트 `src/` 디렉터리 삭제
- Prisma 스키마가 old 버전(대문자 enum, task_required_skills 등)으로 덮어씌워진 것 수정
- RLS 정책의 대문자 enum 값(`'ADMIN'`, `'ASSIGNED'` 등) 소문자로 수정
- `apply_vacation_gaps` RPC: assignments.date 컬럼 없으므로 tasks 조인으로 수정
- `lib/supabase/middleware.ts` 누락 파일 생성

---

## 진행 중인 작업
- Vercel 환경변수 최종 설정 및 Redeploy 확인

---

## 다음 단계 (예정)
1. **전체 흐름 테스트** — 회원가입 → 팀 생성 → 팀원 초대 → 일정 입력 → 배정 → 자동배정 → 휴가 재배정 → 완료 체크 → 공정성 지표 (Vercel 운영 환경에서 실사용자 계정으로 수동 검증 필요)

---

## 아키텍처 결정 사항
- **런타임 쿼리**: Supabase 클라이언트 전용 (RLS 적용됨) — Prisma는 스키마/마이그레이션 전용
- **enum**: 모두 소문자 (`admin/member`, `available/vacation/dayoff`, `assigned/vacant/completed`, `manual/auto`)
- **RepeatType**: `none` 없음 — 반복 없는 경우 `null` 저장
- **availabilities**: row-per-day 방식 (`start_date = end_date = 날짜`), 수정 시 delete+insert
- **assignments**: `date` 컬럼 없음 — 날짜 필터는 tasks 테이블 조인으로 처리
- **역할-플랫폼 분리**: 팀원=모바일 전용, 관리자=PC 전용(배정) + 모바일(조회)
- **스킬 미보유 배정**: 하드 차단 아닌 경고 모달 + `skill_override=true` 기록
- **시간 중복 배정**: 하드 차단

---

## 배포 환경
- **Frontend/Backend**: Vercel (https://task-manager-rosy-theta.vercel.app)
- **DB/Auth**: Supabase (프로젝트 ID: ewlktlbykhibiiqyxdor, 리전: ap-southeast-2)
- **GitHub**: https://github.com/tothejp/task_manager

---

## 보류/미정 사항 (Phase 2 이후)
- 스킬 숙련도 등급 도입
- 외부 알림(카카오/슬랙) 연동
- 멀티팀 지원, 임무 템플릿
- LLM 기반 자동배정 고도화

---

## 알려진 이슈
- npm audit 경고 4건 (Next.js 14 라인, Next 15/16에서만 패치) — 스택 고정 정책상 유지
- Tailwind CSS "No utility classes detected" 경고 (빌드에는 영향 없음)
- `components/DeviceGuard.tsx`의 관리자 경로 체크(`'/dashboard' || '/tasks' || '/assignments'`)가 실제 라우트(`/admin`, `/admin/tasks`, `/admin/assign`)와 매칭되지 않아 "관리자가 모바일로 접속 시 PC 이용 안내" 배너가 현재 발동하지 않음 (미수정, 별도 작업 필요)

---

## 참고 문서
- `task_manager_PRD.md` — 제품 요구사항 정의서
- `CLAUDE.md` — 개발 작업 가이드
- `prisma/schema.prisma` — 데이터 모델
- `supabase/rls_policies.sql` — RLS 정책 및 SECURITY DEFINER 함수
