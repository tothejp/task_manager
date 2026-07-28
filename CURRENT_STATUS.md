# CURRENT_STATUS.md — 임무분담표(TaskShare, UI상 "Task Manager") 진행 상황

마지막 업데이트: 2026-07-28

## 현재 단계: 로그인/네비게이션 성능 개선 + UI 개선 다수 반영 완료. DB 마이그레이션 전부 실행 완료, 당장 막힌 작업 없음

---

### 이번 세션에서 반영한 것 (2026-07-28, 세 번째 라운드)
- **로그인 에러 메시지 분리**: 기존엔 "이메일 또는 비밀번호가 올바르지 않습니다" 하나로만 안내했는데, 미등록 이메일/비밀번호 오류를 구분해서 보여주도록 변경([app/(auth)/login/actions.ts](app/(auth)/login/actions.ts)). Supabase는 계정 열거 공격 방지를 위해 이 둘을 기본적으로 구분해주지 않으므로, 이메일 가입 여부를 확인하는 SECURITY DEFINER RPC(`is_email_registered`)를 새로 추가함([supabase/email_lookup_rpc.sql](supabase/email_lookup_rpc.sql), 실행 완료).
  - **보안 트레이드오프 안내함, 사용자 승인받고 진행**: 이 방식은 로그인 화면만으로 특정 이메일의 가입 여부를 확인할 수 있게 만든다(사용자 열거). 관리자 승인제라 외부인이 임의 가입할 수 없어 리스크가 낮다는 판단하에 의도적으로 허용.

### 두 번째 라운드 (2026-07-28)
- **모바일 사이드바 이름 잘림 수정**: 팀원(모바일 전용 사용자)이 보는 좁은 아이콘형 사이드바에서 "팀명 · 이름"이 한 글자로 잘려 보이던 것을, 데스크톱 폭(`md:` 이상)에서만 전체 텍스트를 보여주고 모바일에서는 텍스트 대신 사람 아이콘으로 표시하도록 변경([components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)). `/me` 링크 자체는 그대로 유지.
- **휴가 일정 저장 딜레이 원인 수정**: `setDayStatus`가 선택한 날짜 하나하나마다 순차적으로 delete+insert를 반복하고 있었음 — 휴가 기간을 여러 날 선택하거나 매주 반복 휴무(8주)를 선택하면 최대 14~16회의 순차 Supabase 왕복이 발생해 저장이 느렸음. 날짜 전체를 한 번에 지우고 한 번에 넣는 배치 쿼리로 변경해 선택한 날짜 수와 무관하게 왕복 2회로 고정([app/(app)/schedule/actions.ts](app/(app)/schedule/actions.ts)).
- **저장완료 표시 추가**: 일정 저장 폼을 수동 제출(패시브 `<form action>`)에서 `onSubmit` 핸들러로 바꿔 저장 중/저장완료/실패 상태를 클라이언트에서 추적 — 저장 중엔 버튼이 "저장 중..."으로 비활성화되고, 완료되면 "저장완료" 텍스트가 표시됨([components/schedule/ScheduleCalendar.tsx](components/schedule/ScheduleCalendar.tsx)).

### 이전 라운드에서 반영한 것 (2026-07-28, 첫 번째 라운드)
- **로그인/메뉴 전환 딜레이 개선**: 레이아웃과 각 페이지가 auth/member/superadmin/teamId를 중복 조회하던 것을 `getCurrentMember`/`checkIsSuperadmin`/`resolveEffectiveTeamId`에 React `cache()`를 적용해 요청당 1회로 줄임([lib/get-current-member.ts](lib/get-current-member.ts), [lib/team-context.ts](lib/team-context.ts)). 로그인 시 `/dashboard`를 경유하지 않고 목적지로 바로 리다이렉트하도록 변경([app/(auth)/login/actions.ts](app/(auth)/login/actions.ts)).
- **날짜 선택기**: 화면 중앙 모달 → 버튼 바로 아래 팝오버로 변경, 버튼 너비를 내용 크기로 축소([components/ui/DatePickerField.tsx](components/ui/DatePickerField.tsx)). 중대현황판/과업관리 공통 적용.
- **중대현황판**: 전체/가용 인원 카드를 클릭하면 이름/상태 표가 펼쳐지는 접기 UI로 변경([components/admin/RosterSummary.tsx](components/admin/RosterSummary.tsx)). 과업 배정 보드와 미완료 과업 목록에서 시간 표시 제거(과업이 날짜 단위로만 관리되어 시간 표시가 항상 00:00~23:59로 의미가 없었음).
- **과업 관리**: 표에서 과업명/설명을 클릭하면 바로 인라인 수정, 요구인원은 드롭다운으로 즉시 변경 가능([components/admin/TaskInlineFields.tsx](components/admin/TaskInlineFields.tsx)) — 기존 "수정" 버튼의 전체 수정 모달과 별개 경로로 공존. "새 과업 만들기"를 인라인 폼에서 모달로 전환([components/admin/TaskEditButton.tsx](components/admin/TaskEditButton.tsx)에 `TaskCreateButton` 추가).
- **조직원 관리 — 스킬 태그 전역 공유**: 팀별로 분리돼 있던 스킬 태그를 모든 중대가 공유하는 하나의 카탈로그로 전환. 앱 코드에서 `skill_tags` 조회 시 `team_id` 필터 제거(admin/tasks/organization 3곳), RLS도 `supabase/skill_tags_shared.sql`로 전체 공개 조회 + 관리자면 팀 무관 쓰기로 변경(실행 완료). "새 스킬 추가"를 모달로 전환, 스킬 칩을 더블클릭하거나 길게 누르면 확인 후 삭제(다른 팀이 쓰고 있어도 함께 삭제됨 — DB cascade).
  - **알려진 제약**: `skill_tags`의 DB 유니크 제약이 여전히 `(team_id, name)`이라, 이미 다른 팀이 같은 이름으로 만들어둔 스킬이 있으면 전역 목록에 동일 이름이 중복으로 보일 수 있다(현재 시드 데이터는 본부중대에만 스킬이 있어서 당장은 문제 없음). 전역 유니크로 바꾸려면 별도 스키마 마이그레이션 필요 — 다음에 필요해지면 알려줄 것.

---

## 완료된 작업

### 기능 구현
- [x] PRD v0.5 확정 (`task_manager_PRD.md`)
- [x] Prisma 스키마 (`prisma/schema.prisma`) — 스키마 문서/마이그레이션 참고용, 런타임 쿼리는 Supabase 클라이언트 전용
- [x] 인증 — `/login`, `/signup`, 가입 승인제(이메일 인증 대신 관리자 승인, `members.status`)
- [x] 팀 합류 — `/onboarding`에서 관리자가 미리 만든 팀 중 선택 + 이름 입력으로 신청(`list_teams_for_onboarding` RPC). 팀 생성/초대코드 합류 UI는 없음 — 팀은 관리자가 SQL로만 생성
- [x] 팀원 일정 입력 — `/schedule`
- [x] 팀원 임무 확인/완료 체크 — `/my-tasks`, `mark_assignment_completed` RPC
- [x] **중대 현황판 — `/admin`**: 가용인원 현황(전체/가용 인원, 이름/상태 테이블) + 미완료 과업 강조 + **과업 배정(Drag & Drop)까지 이 페이지 하나로 통합**. 완료율 섹션과 스킬 요약 카드는 사용자 요청으로 제거됨. 날짜 선택은 공용 `DatePickerField`(클릭 시 모달로 월 달력) 사용
- [x] 과업 관리 — `/admin/tasks`: 생성/**수정**(모달 폼)/삭제. 시간 단위 관리는 제거하고 날짜 단위로만 관리(내부적으로 `start_time=00:00`/`end_time=23:59` 고정값 사용 — 같은 날 여러 과업에 한 명을 배정할 수 없는 트레이드오프 있음, 확인 후 진행)
- [x] D&D 과업 배정 — 기존 `/admin/assign` 페이지는 삭제되고 `/admin`(중대 현황판)에 통합됨. 사이드바에서 "과업 배정" 메뉴도 제거. 시간 중복 하드 차단, 필수 스킬 미보유는 경고 모달(하드 차단 아님) + `skill_override` 기록
- [x] 자동배정 — 순수 함수 `recommendAssignments()`, 미리보기→확정 플로우 (중대 현황판 내 배정 보드에 포함)
- [x] 휴가→재배정 (PRD 3.7) — 휴가 등록 시 `apply_vacation_gaps` RPC, 배정 보드에 공백 알림 표시
- [x] 공정성 지표 — `/admin/fairness`, 구성원별 누적 배정 막대그래프, 평균 대비 ±20% 편차 경고. **사이드바 메뉴 맨 아래로 이동, 추가 기능 개선은 보류 중**
- [x] **조직원 관리 — `/admin/organization`** (구 "팀원 승인" 탭 대체): 세 영역으로 구성
  1. 가입 승인 대기 — 별도 카드(주황 배경)로 분리, 신청자 이름/계정(이메일)/신청 소속 표시(`list_pending_members_for_team` RPC로 auth.users 이메일 조회)
  2. 조직원 목록 — 이름 + **계급(이병/일병/상병/병장) 선택 드롭다운**(`MemberRankSelect`)
  3. 스킬 태그 관리 — 태그 생성 + **Drag & Drop으로 조직원에게 부여**(스킬 칩을 조직원 위로 드래그), 배지 클릭으로 회수
- [x] 슈퍼관리자 + 팀 전환 (tothejp 전용) — `public.superadmins` + `is_superadmin()`, 사이드바 `TeamSwitcher`(쿠키 `active_team_id`), `lib/team-context.ts`의 `resolveEffectiveTeamId()`가 핵심
- [x] 로그인/회원가입 UI — 로고+텍스트가 합쳐진 이미지(`public/task-manager-logo.png`)를 헤더로 사용, 로고 색에서 뽑은 `brand` 팔레트(`tailwind.config.ts`)로 버튼/링크/포커스링 통일. 모바일에서 입력 글씨가 회색으로 보이던 문제 수정(`text-gray-900` 명시)
- [x] 사이드바/파비콘 — 로고에서 분리 추출한 방패 아이콘(`public/task-manager-icon.png`, `app/icon.png`) 적용. 사이드바 로고 클릭 시 `/dashboard`로 이동, 팀/이름 표시를 상단으로 옮기고 `/me`(내 정보 페이지)로 연결
- [x] 전역 스타일 — Drag & Drop 조작이 많아 `tailwind.config.ts`의 `rounded-*`/`text-*` 스케일을 한 단계씩 키움
- [x] `DatePickerField`(`components/ui/DatePickerField.tsx`) — 평소엔 선택 날짜만 보이고 클릭 시 **모달**로 월 달력이 뜨는 공용 컴포넌트. 중대 현황판/과업 관리에서 사용. **주의**: 클라이언트 컴포넌트라 서버 컴포넌트에서 만든 함수를 prop으로 넘기면 안 됨(직렬화 불가 → 렌더링 중 서버 예외) — `basePath`/`paramName` 문자열만 넘기고 href는 컴포넌트 내부에서 조립
- [x] 공통 유틸 — `isTimeOverlapping()`, `lib/date.ts`, `lib/device.ts`, `lib/auto-assign.ts`
- [x] 테스트 계정 12개 생성 (Supabase Admin API로 직접 생성, 전부 비밀번호 `123456`): `master1/2/3@gmail.com`(각 본부/지원/운용중대 관리자), `test1~9@gmail.com`(팀별 3명씩 팀원). 과업도 세 팀에 각 10개씩(총 30개) 시드됨

### 운영 배포
- [x] Vercel — https://task-manager-rosy-theta.vercel.app (GitHub main 브랜치 자동 배포)
- [x] Supabase 프로젝트: `ewlktlbykhibiiqyxdor`

---

## 알려진 트레이드오프/제약
- **과업 시간 개념 제거**: 과업은 날짜 단위로만 관리(시작/종료 시각, 반복주기 UI 제거). DB엔 여전히 `start_time`/`end_time`이 있고 내부적으로 00:00~23:59 고정값을 넣는데, 이 때문에 시간 중복 차단 로직상 **같은 날 한 사람에게 과업을 2개 이상 배정할 수 없다.** 사용자가 이 트레이드오프를 인지하고 승인함.
- **서버→클라이언트 함수 prop 금지**: 한 번 이 문제로 관리자 대시보드/과업관리/과업배정 전체가 500 에러 났던 적 있음(원인: `DatePickerField`에 콜백 함수를 prop으로 전달). 새 클라이언트 컴포넌트를 만들 때 서버 컴포넌트에서 정의한 일반 함수를 prop으로 넘기지 말 것 — 문자열/plain data만 넘기거나, `"use server"` 액션(또는 그 bind 결과)만 넘길 것.
- **`rank`는 예약어**: Postgres 컬럼명으로 쓰면 안 됨(순서집합 집계함수 `rank()`와 충돌). 비슷한 사고를 막기 위해 새 컬럼명 지을 때 Postgres 내장 함수명과 겹치지 않는지 확인할 것.

---

## 다음 단계
1. 스킬 태그가 팀 구분 없이 전역으로 보이는지, 다른 팀 관리자가 만든 스킬도 D&D 가능한지 실사용 확인 (RLS 스크립트 실행 완료)
2. 로그인/사이드바 메뉴 전환 체감 속도 확인 (레이아웃-페이지 중복 조회 캐싱 + 로그인 리다이렉트 단축 적용됨)
3. 모바일에서 팀원 사이드바 아이콘/`/me` 이동 확인, 휴가 등록(특히 여러 날짜 범위/매주 반복) 저장 속도 및 "저장완료" 표시 실사용 확인
4. 중대 현황판 — 날짜 선택 팝오버 위치/너비, 전체·가용 인원 접기 펼치기, 과업 배정 보드 실사용 확인
5. 과업 관리 — 과업명/설명 인라인 수정, 요구인원 드롭다운, "새 과업 만들기" 모달 실사용 확인
6. 조직원 관리 — 스킬 태그 모달 생성, 더블클릭/롱프레스 삭제 실사용 확인 (모바일 롱프레스 제스처가 드래그 시작과 충돌하지 않는지 특히 확인 필요)
7. 공정성 지표 — 사용자가 "차후 기능 개선 예정"이라고 밝힘, 다음 요청 대기

---

## 아키텍처 결정 사항
- **런타임 쿼리**: Supabase 클라이언트 전용 (RLS 적용됨) — Prisma는 스키마 문서용
- **enum**: 소문자(`admin/member`, `available/vacation/dayoff`, `assigned/vacant/completed`, `manual/auto`) + 계급은 한글 값(`이병/일병/상병/병장`)
- **availabilities**: row-per-day 방식, 수정 시 delete+insert
- **assignments**: `date` 컬럼 없음 — 날짜 필터는 tasks 테이블 조인으로 처리
- **역할-플랫폼 분리**: 팀원=모바일 전용, 관리자=PC 전용(과업 생성/배정) + 모바일(조회 전용, `DeviceGuard.tsx`가 `/admin/tasks` 경로만 모바일 차단 — 배정은 중대 현황판이 자체적으로 모바일 시 조회 전용 뷰로 전환하므로 별도 차단 불필요)
- **스킬 미보유 배정**: 하드 차단 아닌 경고 모달 + `skill_override=true` 기록
- **시간 중복 배정**: 하드 차단(단, 위 트레이드오프로 사실상 하루 1과업 제한과 동일해짐)
- **가입 승인**: 이메일 인증 대신 관리자 승인, 조직원 관리 페이지에서 처리
- **팀 생성**: 관리자(개발자)가 SQL로만 생성, 사용자는 `/onboarding`에서 합류 신청만 가능
- **슈퍼관리자**: `members.user_id` 전역 UNIQUE 제약 때문에 여러 팀 관리가 필요한 tothejp 계정만 `superadmins` 테이블 + 팀 전환 UI로 예외 처리
- **스킬 태그는 팀 격리 예외**: `skill_tags`만 모든 팀이 공유하는 전역 카탈로그(2026-07-28부터). 다른 모든 테이블(members/tasks/assignments/availabilities 등)은 여전히 팀 단위로 격리됨 — CLAUDE.md의 팀 단위 RLS 원칙은 이 테이블 하나만 예외.

---

## 배포 환경
- **Frontend/Backend**: Vercel (https://task-manager-rosy-theta.vercel.app)
- **DB/Auth**: Supabase (프로젝트 ID: `ewlktlbykhibiiqyxdor`)
- **GitHub**: https://github.com/tothejp/task_manager

---

## 보류/미정 사항 (Phase 2 이후)
- 공정성 지표 기능 개선 (사용자가 예고함, 상세 요구사항 미정)
- 스킬 숙련도 등급 도입
- 외부 알림(카카오/슬랙) 연동
- LLM 기반 자동배정 고도화

---

## Supabase SQL 스크립트 목록 (실행 순서대로)
모두 Supabase SQL Editor에서 직접 실행. 실행 여부는 매 세션 시작 시 사용자에게 확인할 것 — 이 문서만으로 신뢰하지 말 것.

1. `supabase/rls_policies.sql` — 기본 RLS 정책 및 SECURITY DEFINER 함수
2. `supabase/fix_missing_defaults.sql` — teams/members/skill_tags/tasks/assignments/availabilities `id`/`updated_at` 기본값 누락 수정
3. `supabase/team_member_insert_policies.sql` — teams/members INSERT RLS 정책
4. `supabase/member_approval.sql` — 가입 승인제(관리자 승인 방식) 관련 RLS/컬럼
5. `supabase/superadmin.sql` — 슈퍼관리자 테이블/RPC, 팀 전환용 RLS, 초기 팀 3개 생성
6. `supabase/pending_members_email_rpc.sql` — 조직원 관리 승인 대기 목록에 신청자 이메일 노출용 RPC
7. `supabase/seed_test_data.sql` — (선택) 화면 확인용 스킬 태그/과업 시드
8. `supabase/add_member_rank.sql` — 계급 컬럼 추가 (실행 완료)
9. `supabase/skill_tags_shared.sql` — 스킬 태그 전역 공유 전환 (실행 완료)
10. `supabase/email_lookup_rpc.sql` — 로그인 에러 메시지 분리용 RPC (실행 완료)

---

## 참고 문서
- `task_manager_PRD.md` — 제품 요구사항 정의서
- `CLAUDE.md` — 개발 작업 가이드
- `prisma/schema.prisma` — 데이터 모델 문서(런타임에는 안 쓰임, 실제 DB와 100% 일치 보장 안 됨 — 새 기능 작업 시 앱 코드의 실제 쿼리를 기준으로 확인할 것)
