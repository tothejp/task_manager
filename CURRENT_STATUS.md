# CURRENT_STATUS.md — 임무분담표(TaskShare) 진행 상황

마지막 업데이트: 2026-07-22

## 현재 단계: 7단계(자동배정) 완료, 8단계(휴가 등록 → 재배정) 착수 전

## 완료된 작업
- [x] 초기 아이디어 정리 (임무분담표 컨셉, 자동 재배정, 공정성 지표 등)
- [x] PRD v0.1 ~ v0.5 작성 완료 (`task_manager_PRD.md`)
  - 역할-플랫폼 분리 정책 확정 (팀원=모바일, 관리자=PC+모바일 조회)
  - 휴가 즉시 반영, 유료화 계획 없음 등 정책 확정
  - 스킬 부여/매칭, 과업 필수 스킬 통제(경고 모달 방식), Drag & Drop 배정, 자동배정 기능 정의
  - 시간 중복 배정 정책 확정 (시간 겹치는 경우만 차단)
  - 데이터 모델 초안 작성
- [x] 작업 가이드 문서(`CLAUDE.md`), 기능 소개 문서(`README.md`) 작성
- [x] Next.js 14(App Router) + TypeScript + Tailwind 프로젝트 뼈대 구성 (`package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `src/app`)
- [x] Prisma 스키마 작성 (`prisma/schema.prisma`) — PRD 6장 데이터 모델 기반
  - teams / members / skill_tags / member_skills / availabilities / tasks / task_required_skills / assignments
  - skill_tags는 배열 컬럼 대신 조인 테이블로 설계 (관리자 전용 쓰기 RLS를 테이블 단위로 분리하기 위함)
  - assignments.skill_override로 경고 모달 확인 후 배정 여부 추적
  - `npx prisma validate` 통과 확인
- [x] Supabase 클라이언트 초기화 코드 작성 (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `src/lib/prisma.ts`), `.env.example` 작성
- [x] RLS 정책 SQL 작성 (`supabase/rls_policies.sql`)
  - 팀 단위 데이터 격리, skill_tags/member_skills 관리자 전용 쓰기
  - tasks/assignments 쓰기는 관리자만 (D&D·자동배정은 PC 전용 기능이므로)
  - 팀원의 완료 체크는 테이블 UPDATE 대신 `mark_assignment_completed()` SECURITY DEFINER 함수로만 허용 (컬럼 단위 변조 방지)
- [x] 팀 생성/구성원 초대 RPC 함수 작성 (`create_team_with_admin`, `join_team_with_invite_code`, `supabase/rls_policies.sql`)
  - service role 키를 앱 서버에 두지 않고 SECURITY DEFINER 함수로 최초 팀/멤버 행을 생성 (최소 권한 원칙)
  - `Team.inviteCode`(cuid, unique) 추가 — 초대 링크는 `/join/[code]` 형태
  - 한 사용자는 한 팀에만 소속 가능(`Member.userId` unique) — 이미 소속 시 함수에서 예외 발생
- [x] 인증 페이지 구현: `/login`, `/signup`, `/signup/check-email`, `/auth/callback`(이메일 인증 PKCE 코드 교환)
- [x] 온보딩(새 팀 만들기) `/onboarding`, 초대 참여 `/join/[code]` 페이지 + 서버 액션 구현
  - 초대 링크로 로그인 유도 시 `next` 파라미터로 원래 페이지로 복귀
- [x] 세션 갱신 미들웨어(`middleware.ts`), 로그인 후 랜딩 페이지(`src/app/page.tsx`) 구현
- [x] User-Agent 기반 비차단 디바이스 안내 배너 구현 (`src/lib/device.ts`, `src/components/DeviceNotice.tsx`, `src/app/layout.tsx`)
  - CLAUDE.md 2.1 원칙대로 하드 차단 없이 안내 문구 + 닫기(계속 진행) 버튼만 제공
- [x] `npx tsc --noEmit` 통과, 더미 환경변수로 `npm run build` 성공(모든 라우트가 동적 렌더링으로 확인됨)

### 아키텍처 결정: Prisma는 스키마/마이그레이션 전용, 런타임 조회는 Supabase 클라이언트
Prisma는 `DATABASE_URL`의 고정 자격 증명으로 접속하므로 RLS가 적용되지 않는다. 따라서
런타임에 사용자별/팀별 데이터를 조회·수정할 때는 반드시 Supabase 클라이언트
(`src/lib/supabase/server.ts` 등, 로그인 사용자의 세션으로 PostgREST를 통해 RLS가 적용됨)를 사용하고,
Prisma(`src/lib/prisma.ts`)는 스키마 정의와 마이그레이션에만 쓴다. 이후 단계에서 라우트 핸들러나
서버 컴포넌트를 작성할 때도 이 규칙을 유지해야 팀 단위 데이터 격리가 실제로 보장된다.

- [x] 팀원 모바일 일정 입력 화면 구현 (`/schedule`, PRD 3.2)
  - 날짜 유틸(`src/lib/date.ts`): 월 그리드, 날짜 범위 나열, 주간 반복 날짜 생성
  - `ScheduleCalendar` 클라이언트 컴포넌트: 월간 캘린더, 날짜 클릭 시 상태(가용/휴가/휴무) 등록 폼
  - 휴가는 종료일 지정 시 기간 전체를 upsert, 휴무는 "매주 반복" 체크 시 다음 8주치를 미리 생성(`WEEKLY_REPEAT_WEEKS` 상수)
  - 반복으로 생성된 특정 날짜를 다시 등록하면 `@@unique([memberId, date])`로 자연스럽게 덮어써짐(예외일 처리)
  - RLS `availabilities_write_self_only` 정책을 그대로 사용 — 서버 액션은 클라이언트가 보낸 memberId를 신뢰하지 않고 `getCurrentMember()`로 직접 조회
  - PRD 3.2는 팀원 전용 기능이므로 `/schedule`은 `role === "MEMBER"`만 접근 가능(관리자는 홈으로 리다이렉트) — 관리자 개인 일정 입력은 PRD에 없는 기능이라 추가하지 않음
  - 홈 화면에 팀원 전용 "내 일정 입력" 링크 추가
  - `tsc --noEmit` 통과, 더미 환경변수로 `npm run build` 성공

- [x] 관리자 PC 가용인원 대시보드 + 스킬 관리 구현 (`/admin`, PRD 3.3, 3.1 스킬 부여/회수 포함)
  - 날짜 선택 시 전체 팀원을 가용/휴가/휴무로 자동 분류 (일정 미등록 시 기본값 "가용")
  - 전체/가용 인원 요약 카드 + 스킬별 "가용 N / 보유 M" 요약 카드
  - 스킬 필터(드롭다운)로 특정 스킬 보유자만 목록 필터링
  - 스킬 태그 생성 및 팀원별 부여/회수 (`src/components/admin/SkillManagement.tsx`, `src/app/admin/actions.ts`) — RLS `skill_tags_write_admin_only`/`member_skills_write_admin_only` 정책 활용
  - `/admin`은 `role === "ADMIN"`만 접근 가능(팀원은 홈으로 리다이렉트)
  - PRD 2장 정책 반영: 관리자가 모바일(User-Agent)로 접속하면 스킬 부여/회수 UI 자체를 숨기고 조회 전용으로 전환 (배너 수준이 아닌 실제 기능 제한 — 팀원의 PC 접속 안내와는 다른, 더 엄격한 정책이라 별도로 구현)
  - `tsc --noEmit` 통과, 더미 환경변수로 `npm run build` 성공

- [x] 과업 생성/관리 화면 구현 (`/admin/tasks`, PRD 3.4)
  - 과업 속성(이름/설명/날짜/시작~종료 시각/요구인원수/필수 스킬 다중 선택/반복 주기) 입력 폼
  - 반복 주기(매일/매주/매월) 선택 시 정해진 기간만큼 실제 과업 행을 미리 생성 (`src/lib/date.ts`의 `enumerateDailyOccurrences`/`enumerateMonthlyOccurrences` 추가, availabilities와 동일한 "반복 규칙 대신 실제 행 미리 생성" 방식)
  - 종료 시각이 시작 시각보다 빠르면 생성 거부
  - 목록: 날짜순 정렬, 필수 스킬/반복 주기 표시, 관리자 PC에서만 삭제 가능
  - `/admin/tasks`도 `role === "ADMIN"`만 접근, 모바일 접속 시 생성/삭제 UI 숨기고 조회 전용 (기존 `/admin` 패턴과 동일)
  - `/admin` ↔ `/admin/tasks` 상호 링크 연결
  - `tsc --noEmit` 통과, 더미 환경변수로 `npm run build` 성공

- [x] Drag & Drop 배정 화면 구현 (`/admin/assign`, PRD 3.5)
  - `src/lib/time-overlap.ts`의 `isTimeOverlapping()` 공통 유틸 작성 (CLAUDE.md 2.3 — 이후 자동배정에서도 재사용 예정)
  - dnd-kit(`@dnd-kit/core`)로 좌측 가용 인원 카드(드래그) / 우측 과업 슬롯(드롭) 구현 (`AssignmentBoard.tsx`)
  - 요구 인원 초과 시 드롭 거부, 시간 중복 시 **하드 차단**(에러 메시지로 즉시 안내), 필수 스킬 미보유 시 **경고 모달**(확인 시 `skill_override=true`로 배정) — 두 정책을 혼동하지 않도록 분리 구현 (CLAUDE.md 2.4)
  - 클라이언트에서 1차 검증 후 서버 액션(`assignMember`)에서 동일한 시간 중복/인원 초과 검증을 재수행 (데이터 무결성 보장, `/admin/assign/actions.ts`)
  - 배정 취소(unassign) 버튼 제공
  - 관리자가 모바일로 접속하면 D&D 대신 조회 전용 목록으로 전환 (`/admin`, `/admin/tasks`와 동일한 패턴)
  - `/admin`, `/admin/tasks`, `/admin/assign` 상호 링크 연결
  - `tsc --noEmit` 통과, 더미 환경변수로 `npm run build` 성공

- [x] 자동배정 로직 구현 (PRD 3.6)
  - 순수 함수 `recommendAssignments()` 작성 (`src/lib/auto-assign.ts`, CLAUDE.md 2.2 — 입력: 가용인원+과업정보+기존배정, 출력: 추천 배정 결과)
  - 규칙: 시간 겹치는 인원 후보 제외(`isTimeOverlapping` 재사용, 같은 실행 내 추천과 기존 당일 배정 모두 반영) → 필수 스킬 전원 보유자만 후보로 사용(미보유자는 자동배정 대상에서 완전히 제외) → 누적 배정 업무량 오름차순 → 동률 시 최근 배정일이 오래된 사람 우선
  - 미충원 시 사유 안내(`'B과업': 필요 인원 3명 중 2명만 배정됨 — 해당 스킬 보유 가용 인원 부족`)
  - **미리보기 → 확정 플로우 구현** (PRD 3.6 원문에 명시된 대로): "자동배정 추천받기" 클릭 시 DB에 아무것도 쓰지 않고 추천 결과만 계산(`getAutoAssignRecommendations`), 추천 항목은 점선 칩으로 표시되어 개별 클릭으로 제외 가능, "확정" 클릭 시에만 실제 반영(`confirmAutoAssignments`, `assigned_by='AUTO'`)
  - 이미 수동 배정된 슬롯은 자동배정이 건드리지 않음(필요 인원에서 기존 배정분 제외하고 계산)
  - `assignMember`의 서버 측 검증 로직을 `insertAssignmentIfValid()`로 추출해 수동 배정과 자동배정 확정이 동일한 시간 중복/인원 초과 검증을 공유하도록 리팩터링 (`/admin/assign/actions.ts`)
  - `tsc --noEmit` 통과, 더미 환경변수로 `npm run build` 성공
  - **문서 정정**: 아래 "보류/미정 사항"에 있던 "자동배정 미리보기가 v0.5에서 제외됨" 메모는 `task_manager_PRD.md` 3.6 원문(미리보기 섹션이 그대로 남아있음)과 어긋나는 오기였음을 확인. PRD 원문을 기준으로 미리보기 플로우를 구현했고, 아래 항목은 제거함

## 진행 중인 작업
- 없음

## 다음 단계 (예정)
1. **[Supabase 연결은 보류 중]** 사용자가 나중에 Supabase 프로젝트 생성(대시보드) → `.env.local`에 값 채우기 → `npx prisma migrate dev`로 마이그레이션 적용 → `supabase/rls_policies.sql` 실행 → 지금까지 만든 화면 전체를 브라우저에서 실제로 테스트 예정
2. 휴가 등록 → 배정 공백 처리 → 재배정 플로우 구현 (3.7)
3. 완료 체크 기능 구현 (3.8)
4. 공정성 지표 시각화 구현 (3.9)

## 보류/미정 사항 (Phase 2 이후 검토)
- 스킬 숙련도 등급(상/중/하) 도입 여부 및 시점
- 외부 알림(카카오/슬랙) 연동, 배정 변경 푸시 알림
- 멀티팀 지원, 임무 템플릿 기능

## 알려진 이슈
- `npm install` 시 Next.js 14 라인에서 완전히 해소되지 않는 npm audit 경고 4건이 남아있음 (Next 15/16에서만 패치된 항목들). 기술 스택이 Next.js 14로 고정(`CLAUDE.md` 1장)되어 있어 임의로 메이저 업그레이드하지 않았음 — 추후 스택 변경 여부는 별도 논의 필요.

## 참고 문서
- `task_manager_PRD.md` — 제품 요구사항 정의서 (최종)
- `CLAUDE.md` — 개발 작업 가이드
- `README.md` — 앱 기능 소개
- `prisma/schema.prisma` — 데이터 모델
- `supabase/rls_policies.sql` — RLS 정책

## 변경 로그
- 2026-06-24: PRD v0.5 확정, CLAUDE.md/README.md/CURRENT_STATUS.md 최초 작성
- 2026-07-22: 1단계 완료 — Next.js 프로젝트 뼈대, Prisma 스키마, Supabase 클라이언트, RLS 정책 작성
- 2026-07-22: 2단계 완료 — 인증(로그인/회원가입/이메일 콜백), 팀 생성/초대 RPC, 온보딩·초대 참여 페이지, 세션 미들웨어, 디바이스 안내 배너 구현
- 2026-07-22: 3단계 완료 — 팀원 모바일 일정 입력 화면(`/schedule`), 날짜 유틸, 반복/기간 등록 서버 액션 구현. Supabase 프로젝트 연결은 사용자 요청으로 보류, 코딩을 먼저 이어가기로 함
- 2026-07-22: 4단계 완료 — 관리자 가용인원 대시보드(`/admin`), 스킬 태그 생성/부여/회수, 관리자 모바일 접속 시 조회 전용 전환 구현
- 2026-07-22: 5단계 완료 — 과업 생성/관리 화면(`/admin/tasks`), 반복 주기(매일/매주/매월) 생성 로직 구현
- 2026-07-22: 6단계 완료 — Drag & Drop 배정 화면(`/admin/assign`), 시간 중복 하드 차단/스킬 경고 모달, 공통 유틸 `isTimeOverlapping` 구현
- 2026-07-22: 7단계 완료 — 자동배정 순수 함수(`recommendAssignments`) + 미리보기/확정 플로우 구현. 진행 중 CURRENT_STATUS.md의 "미리보기 v0.5 제외" 메모가 PRD 원문과 어긋난 오기임을 발견해 정정함
- 2026-07-22: 6단계 완료 — Drag & Drop 배정 화면(`/admin/assign`), 시간 중복 하드 차단/스킬 경고 모달, 공통 유틸 `isTimeOverlapping` 구현
