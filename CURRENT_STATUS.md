# CURRENT_STATUS.md — 임무분담표(TaskShare, UI상 "Task Manager") 진행 상황

마지막 업데이트: 2026-07-22

## 현재 단계: 기능 구현 + UI 리디자인 코드는 전부 완료, DB 스크립트 2개 미실행 + 실사용 검증 남음

---

## 완료된 작업

### 기능 구현 (1~9단계)
- [x] PRD v0.5 확정 (`task_manager_PRD.md`)
- [x] Prisma 스키마 작성 (`prisma/schema.prisma`) — 소문자 enum, start_date/end_date, task_skills, assignments date 컬럼 없음
- [x] Supabase 클라이언트 초기화 (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [x] RLS 정책 SQL (`supabase/rls_policies.sql`) — 팀 단위 격리, 관리자/팀원 권한 분리
- [x] 인증 페이지 — `/login`, `/signup`, `/auth/callback`
- [x] 팀 합류 — `/onboarding`에서 관리자가 미리 만들어둔 팀 목록(드롭다운, `list_teams_for_onboarding` RPC) 중 선택 + 이름 입력으로 신청. **`/join`(초대코드), `/team/new`(팀 생성)는 완전히 제거됨** — 팀 생성은 이제 관리자만 SQL로 수행
- [x] 팀원 일정 입력 — `/schedule`, 월간 캘린더, 가용/휴가/휴무 등록
- [x] 관리자 대시보드 — `/admin`, 가용인원 현황, 스킬 태그 관리
- [x] 과업 관리 — `/admin/tasks`, 반복 과업 생성/삭제
- [x] D&D 배정 화면 — `/admin/assign`, 시간 중복 차단, 스킬 경고 모달
- [x] 자동배정 — 순수 함수 `recommendAssignments()`, 미리보기→확정 플로우
- [x] 휴가→재배정 (PRD 3.7) — `schedule/actions.ts`에서 휴가 등록 시 `apply_vacation_gaps` RPC 호출, `/admin/assign`에 공백 알림 표시 후 기존 자동배정으로 재배정
- [x] 완료 체크 (PRD 3.8) — `/my-tasks`(팀원/모바일)에서 `mark_assignment_completed` RPC 호출, `/admin`에 미완료 과업 강조 및 월별 완료율 표시
- [x] 공정성 지표 시각화 (PRD 3.9) — `/admin/fairness`, 구성원별 누적 배정 막대그래프, 평균 대비 ±20% 편차 경고 (`FAIRNESS_DEVIATION_THRESHOLD` 상수)
- [x] 가입 승인제 (이메일 인증 대체) — 팀 합류 신청자는 `members.status='pending'`으로 등록, `/pending` 대기 화면 표시, 관리자가 `/admin/members`에서 승인/거부. DB 변경은 `supabase/member_approval.sql`을 Supabase에서 직접 실행 필요 (아래 "진행 중인 작업" 참고)
- [x] 슈퍼관리자 + 팀 전환 (tothejp 전용) — `members.user_id`가 전역 UNIQUE라 한 계정이 여러 팀의 정식 멤버가 될 수 없는 제약을 우회하기 위해 도입. `public.superadmins` 테이블 + `is_superadmin()` RLS 헬퍼로 모든 팀 데이터 접근 허용, 사이드바 하단의 `TeamSwitcher`(쿠키 `active_team_id`)로 조회/조작 대상 팀 전환. `lib/team-context.ts`가 핵심 로직(`resolveEffectiveTeamId`)이고, 5개 관리자 페이지 + 4개 관리자 액션 파일의 `requireAdmin()`이 이를 통해 `member.team_id`를 해석된 팀으로 치환. DB 변경은 `supabase/superadmin.sql` 실행 필요. 초기 팀 3개(지원중대/운용중대/본부중대)도 이 스크립트가 생성하고 tothejp을 본부중대 admin + 슈퍼관리자로 등록함
- [x] UI 리디자인 — 앱 이름 "임무분담표"→"Task Manager"로 변경(탭 타이틀, 로그인 화면 로고형 브랜딩), 좌측 사이드바 도입(`components/layout/AppShell.tsx`+`Sidebar.tsx`, 관리자/팀원 화면 전체, `lucide-react` 아이콘), 각 페이지 헤더의 개별 nav-link 행 제거(사이드바로 통합), 관리자 대시보드 날짜 필터를 네이티브 input에서 캘린더 그리드(`components/admin/DateFilterCalendar.tsx`)로 교체, `/dashboard`를 nav-card 화면에서 순수 리다이렉트 라우터로 전환(로그인 직후 관리자→`/admin`, 팀원→`/schedule` 바로 이동), Geist 폰트를 body에 실제 적용. `TeamSwitcher`의 서버 액션(`setActiveTeam`)은 클라이언트 컴포넌트(`Sidebar.tsx`)에서 끌어쓰다 보니 `next/headers` 의존 코드가 클라이언트 번들에 섞여 빌드가 깨졌던 문제가 있어, `lib/team-switch-action.ts`로 액션만 분리해서 해결함
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
- `DeviceGuard.tsx` 관리자 경로 체크가 실제 라우트(`/admin/tasks`, `/admin/assign`)와 매칭되지 않던 것 수정
- `tailwind.config.ts`의 `content`가 존재하지 않는 `./src/app`, `./src/components`를 가리키고 있어 Tailwind가 사용 중인 클래스를 하나도 못 찾고 있던 것 수정 (→ `./app`, `./components`). 이 때문에 운영 사이트가 스타일 없이 텍스트로만 렌더링되고 있었음 — 이전에 "빌드에는 영향 없음"이라 기록했던 "No utility classes detected" 경고가 실제로는 이 심각한 버그의 증상이었음
- **[심각] `teams`/`members`/`skill_tags`/`tasks`/`assignments`/`availabilities` 테이블 전부 `id` 컬럼에 DB 기본값이 없었음** (`teams`/`members`는 `updated_at`도 없음). 앱 코드는 Prisma의 `@default(uuid())`/`@updatedAt`을 믿고 `id`/`updated_at`을 아예 안 넣고 insert해왔는데, 이 프로젝트는 Prisma Client를 안 쓰고 Supabase 클라이언트로만 쓰기 때문에 DB 레벨 기본값이 실제로 있어야 했음 — 스키마 생성 시 누락된 것으로 보임(같은 Supabase 프로젝트를 공유하는 BookLog 쪽 테이블들은 전부 `gen_random_uuid()` 기본값이 정상적으로 있어서 대조됨). 즉 팀 생성뿐 아니라 과업 생성/스킬 태그 생성/배정/일정 입력 등 **앱의 거의 모든 insert가 이 문제로 실패하고 있었을 가능성이 높음**. `supabase/fix_missing_defaults.sql`로 각 테이블에 `default gen_random_uuid()`/`default now()` 추가해서 해결(앱 코드는 그대로 두고 DB 기본값만 채움 — 코드 변경 불필요)
- Supabase Auth "Enable Email provider" 설정이 꺼져있어 신규 회원가입이 전부 "Email signups are disabled"로 실패하던 것 발견 → 사용자가 대시보드에서 직접 켬
- `teams`/`members` 테이블에 RLS는 켜져 있는데 INSERT 정책이 없어서 팀 생성/합류가 42501 에러로 막히던 것 발견 → `supabase/team_member_insert_policies.sql` 추가
- 팀 생성 시 `.insert().select().single()`이 RETURNING 과정에서 `teams_select_own_team` SELECT 정책(본인이 이미 그 팀 members여야 함)과 충돌해 실패하던 근본 원인 발견 및 수정(`app/(app)/team/new/actions.ts`) — 이후 팀 생성 자체를 관리자 전용 SQL로 옮기면서 이 페이지는 삭제됨

---

## 진행 중인 작업
- Vercel 환경변수 최종 설정 및 Redeploy 확인
- 가입 승인제 DB 반영 완료: `supabase/member_approval.sql` 실행 + Supabase "Confirm email" 비활성화 모두 적용됨.
- **`supabase/fix_missing_defaults.sql` 실행 필요 (미완료, 사용자 직접 작업 필요, `superadmin.sql`보다 먼저)** — teams/members/skill_tags/tasks/assignments/availabilities id 기본값 누락 수정. 이거 없이는 superadmin.sql의 팀 생성도, 앱의 다른 insert(과업/스킬/배정/일정)도 계속 실패한다.
- **`supabase/superadmin.sql` 실행 필요 (미완료, 사용자 직접 작업 필요)** — 슈퍼관리자 테이블/RPC, 온보딩용 팀 목록 RPC, 팀 전환을 위한 RLS 예외, 초기 팀 3개(지원중대/운용중대/본부중대) 생성이 이 스크립트 하나에 들어있음. 실행 전까지는 `/onboarding` 드롭다운이 비어있고 `/admin` 계열 페이지에서 팀 전환이 동작하지 않는다.
- 회원가입 관련 디버그 에러 메시지가 `app/(auth)/signup/actions.ts`에 임시로 남아있음(사용자 요청으로 유지 중) — 나중에 정리 필요하면 알려줄 것.
- 로그아웃 405 에러 원인 미확인 — 로컬 재현 시 코드 자체는 정상(POST→307). 사용자가 브라우저 Network 탭에서 실제 요청 Method를 확인해주기로 함. 로그아웃 버튼은 이제 사이드바 하단으로 이동(같은 `<form method="POST">` 패턴 재사용).
- UI 리디자인(사이드바/캘린더 날짜선택/브랜딩)은 로컬에서 로그인 화면까지만 시각 확인함(Supabase 자격증명 없어 로그인 이후 화면은 미확인) — Vercel 배포 후 사이드바(관리자 5개 항목/팀원 2개 항목), 팀 전환 드롭다운, 관리자 대시보드 캘린더 날짜 선택 실사용 확인 필요.

---

## 다음 단계 (다음 세션 시작 시 이 순서로)
1. **(최우선) `supabase/fix_missing_defaults.sql` → `supabase/superadmin.sql` 순서로 Supabase SQL Editor에서 실행.** 이 둘을 안 돌리면 팀 생성/합류/과업/배정 등 대부분의 insert가 계속 실패한다.
2. **전체 흐름 테스트** — 일반 계정 가입(이메일 인증 없이 바로 로그인) → `/onboarding`에서 팀 드롭다운 선택+합류 신청 → `/pending` 진입 → tothejp 계정으로 `/admin/members`에서 승인 → 일정 입력 → 배정 → 자동배정 → 휴가 재배정 → 완료 체크 → 공정성 지표
3. tothejp 계정으로 `/admin`, `/admin/tasks`, `/admin/assign`, `/admin/fairness`, `/admin/members`에서 팀 전환 드롭다운으로 지원중대/운용중대/본부중대를 오가며 각 팀 데이터가 올바르게 분리되어 보이는지 확인
4. UI 리디자인 실사용 확인 — 사이드바 내비게이션(관리자 5개/팀원 2개 메뉴), 관리자 대시보드 캘린더 날짜 선택, 로그인 화면 로고
5. 로그아웃 405 에러 재현 여부 확인 (Network 탭에서 실제 요청 Method 확인 — 사용자가 확인해주기로 했었음, 아직 회신 없음)
6. 문제없으면 `app/(auth)/signup/actions.ts`에 남겨둔 디버그용 에러 메시지를 사용자 친화적 문구로 되돌리기

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
- **가입 승인**: 이메일 인증 대신 관리자 승인. `members.status`(active/pending), 관리자가 `/admin/members`에서 승인
- **팀 생성**: 일반 사용자는 팀을 만들 수 없음. 관리자(=지금은 개발자)가 SQL로 미리 만든 팀 중에서 사용자가 `/onboarding` 드롭다운으로 선택해 합류 신청만 가능
- **슈퍼관리자**: `members.user_id`가 전역 UNIQUE라 한 계정=한 팀 정식 멤버 제약이 있어, 여러 팀을 관리해야 하는 계정(tothejp)은 `superadmins` 테이블 등록 + 팀 전환 UI로 예외 처리. 일반 관리자는 여전히 자기 팀 1개만 봄
- **알려진 문서-실제 DB 불일치**: `prisma/schema.prisma`/`supabase/rls_policies.sql`이 실제 Supabase 스키마와 완전히 일치하지 않는다 (예: 앱 코드가 사용하는 `invitations` 테이블·`validate_invitation` RPC는 이 파일들에 정의돼 있지 않음 — Supabase 대시보드에서 직접 추가된 것으로 추정). 새 기능 작업 시 이 파일들을 100% 신뢰하지 말고 실제 앱 코드의 쿼리를 기준으로 확인할 것

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

---

## 참고 문서
- `task_manager_PRD.md` — 제품 요구사항 정의서
- `CLAUDE.md` — 개발 작업 가이드
- `prisma/schema.prisma` — 데이터 모델
- `supabase/rls_policies.sql` — RLS 정책 및 SECURITY DEFINER 함수
- `supabase/member_approval.sql` — 가입 승인제 관련 추가 DB 변경 (Supabase에서 직접 실행 필요, 실행 완료)
- `supabase/team_member_insert_policies.sql` — teams/members INSERT RLS 정책 (Supabase에서 직접 실행 필요, 실행 완료)
- `supabase/fix_missing_defaults.sql` — id/updated_at 기본값 누락 수정 (Supabase에서 직접 실행 필요, **미실행**, superadmin.sql보다 먼저 실행)
- `supabase/superadmin.sql` — 슈퍼관리자/팀 전환/초기 팀 3개 생성 (Supabase에서 직접 실행 필요, **미실행**)
