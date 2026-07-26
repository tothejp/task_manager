# CURRENT_STATUS.md — 임무분담표(TaskShare, UI상 "Task Manager") 진행 상황

마지막 업데이트: 2026-07-26

## 현재 단계: 핵심 기능 + UI 개편 대부분 완료, DB 마이그레이션 1건 실행 대기 중(계급 기능이 이것 때문에 막혀 있음)

---

## ⚠️ 지금 당장 필요한 작업
- **`supabase/add_member_rank.sql` 미실행.** 이게 없으면 `getCurrentMember()`(모든 인증 페이지에서 호출)가 실패해서 로그인한 모든 사용자 화면이 막힌다. 최우선으로 Supabase SQL Editor에서 실행할 것.
  - 컬럼명을 `rank`로 만들면 PostgreSQL의 순서집합 집계함수 `rank()`와 충돌해 파싱 에러가 나므로, 실제 DB 컬럼/타입명은 `member_rank`/`member_rank_enum`이고 앱 코드에서는 `select`할 때 `rank:member_rank` 별칭을 써서 JS 쪽 필드명은 `rank`로 유지한다.

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
  2. 조직원 목록 — 이름 + **계급(이병/일병/상병/병장) 선택 드롭다운**(`MemberRankSelect`, 위 "지금 당장 필요한 작업" 참고)
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
1. **`supabase/add_member_rank.sql` 실행** (최우선, 위 참고)
2. 실행 후 계급 지정 기능(조직원 관리 페이지) 실사용 확인
3. 중대 현황판에 통합된 과업 배정(Drag & Drop) 실사용 재확인 — 페이지 하나에 로직이 많아졌으니 여러 날짜/여러 과업으로 테스트
4. 스킬 태그 Drag & Drop 실사용 확인 (그랩/드롭 제스처가 모바일 관리자 접속 시엔 조회 전용으로 자동 전환되는지도 함께)
5. 과업 수정 모달 실사용 확인
6. 공정성 지표 — 사용자가 "차후 기능 개선 예정"이라고 밝힘, 다음 요청 대기

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
8. **`supabase/add_member_rank.sql` — 미실행. 계급 컬럼 추가 (위 "지금 당장 필요한 작업" 참고)**

---

## 참고 문서
- `task_manager_PRD.md` — 제품 요구사항 정의서
- `CLAUDE.md` — 개발 작업 가이드
- `prisma/schema.prisma` — 데이터 모델 문서(런타임에는 안 쓰임, 실제 DB와 100% 일치 보장 안 됨 — 새 기능 작업 시 앱 코드의 실제 쿼리를 기준으로 확인할 것)
