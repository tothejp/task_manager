-- ============================================================
-- 임무분담표(TaskShare) RLS 정책
-- 참고: CLAUDE.md 3장, task_manager_PRD.md 6장, prisma/schema.prisma
--
-- 원칙
-- 1) 팀 단위 데이터 격리: 팀 A의 사용자는 팀 B의 데이터를 조회/수정 불가
-- 2) skill_tags(및 member_skills)는 관리자만 쓰기 가능, 팀원은 read-only
-- 3) 과업 생성/배정(D&D, 자동배정)은 관리자 전용(PC) 기능이므로 tasks/assignments
--    쓰기 권한도 관리자로 제한한다
-- 4) 팀원의 "완료 체크"는 임의 컬럼 변경을 막기 위해 테이블 UPDATE 정책 대신
--    SECURITY DEFINER 함수(mark_assignment_completed)로만 허용한다
--
-- 주의: 팀 생성 및 구성원 초대(가입)는 아래 create_team_with_admin() /
--       join_team_with_invite_code() SECURITY DEFINER 함수로만 처리한다.
--       서비스 롤 키를 앱 서버에 두지 않고도(최소 권한 원칙) teams/members에
--       최초 행을 삽입할 수 있도록 하기 위함이며, 그래서 teams/members에는
--       별도의 INSERT 정책이 없다 (해당 함수가 RLS를 우회해 대신 삽입한다).
-- ============================================================

-- ------------------------------------------------------------
-- 헬퍼 함수
-- SECURITY DEFINER + search_path 고정: RLS가 걸린 members 테이블을 참조할 때
-- 정책 자기참조로 인한 무한 재귀를 피하고, search_path 하이재킹을 방지한다
-- ------------------------------------------------------------
create or replace function public.current_member_team_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select team_id from public.members where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.members
    where user_id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ------------------------------------------------------------
-- teams
-- ------------------------------------------------------------
alter table public.teams enable row level security;

create policy "teams_select_own_team"
on public.teams for select
using (id = public.current_member_team_id());

create policy "teams_update_admin_only"
on public.teams for update
using (id = public.current_member_team_id() and public.is_current_user_admin())
with check (id = public.current_member_team_id() and public.is_current_user_admin());

-- 팀 생성: 이미 다른 팀 소속이면 차단(멤버는 팀 1개까지, members.user_id UNIQUE와 동일한 전제)
create or replace function public.create_team_with_admin(p_team_name text, p_admin_name text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
begin
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception '이미 소속된 팀이 있어 새 팀을 만들 수 없습니다.';
  end if;

  insert into public.teams (name, created_by)
  values (p_team_name, auth.uid())
  returning * into v_team;

  insert into public.members (team_id, user_id, role, name)
  values (v_team.id, auth.uid(), 'ADMIN', p_admin_name);

  return v_team;
end;
$$;

grant execute on function public.create_team_with_admin(text, text) to authenticated;

-- 초대 링크 참여: 초대 코드로 팀을 찾아 팀원(MEMBER)으로 가입시킨다
create or replace function public.join_team_with_invite_code(p_invite_code text, p_member_name text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
begin
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception '이미 소속된 팀이 있어 다른 팀에 참여할 수 없습니다.';
  end if;

  select * into v_team from public.teams where invite_code = p_invite_code;

  if v_team.id is null then
    raise exception '유효하지 않은 초대 링크입니다.';
  end if;

  insert into public.members (team_id, user_id, role, name)
  values (v_team.id, auth.uid(), 'MEMBER', p_member_name);

  return v_team;
end;
$$;

grant execute on function public.join_team_with_invite_code(text, text) to authenticated;

-- ------------------------------------------------------------
-- members
-- ------------------------------------------------------------
alter table public.members enable row level security;

create policy "members_select_same_team"
on public.members for select
using (team_id = public.current_member_team_id());

create policy "members_update_admin_only"
on public.members for update
using (team_id = public.current_member_team_id() and public.is_current_user_admin())
with check (team_id = public.current_member_team_id() and public.is_current_user_admin());

create policy "members_delete_admin_only"
on public.members for delete
using (team_id = public.current_member_team_id() and public.is_current_user_admin());

-- ------------------------------------------------------------
-- skill_tags: 관리자만 쓰기, 팀원은 read-only
-- ------------------------------------------------------------
alter table public.skill_tags enable row level security;

create policy "skill_tags_select_same_team"
on public.skill_tags for select
using (team_id = public.current_member_team_id());

create policy "skill_tags_write_admin_only"
on public.skill_tags for all
using (team_id = public.current_member_team_id() and public.is_current_user_admin())
with check (team_id = public.current_member_team_id() and public.is_current_user_admin());

-- ------------------------------------------------------------
-- member_skills: 관리자만 부여/회수, 팀원은 조회만
-- ------------------------------------------------------------
alter table public.member_skills enable row level security;

create policy "member_skills_select_same_team"
on public.member_skills for select
using (
  exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_member_team_id()
  )
);

create policy "member_skills_write_admin_only"
on public.member_skills for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_member_team_id()
  )
);

-- ------------------------------------------------------------
-- availabilities: 본인 것은 본인이 쓰기, 조회는 본인 또는 같은 팀 관리자만
--   (PRD 3.3 가용인원 판단은 관리자 전용 기능이며, 팀원끼리 서로의 일정을
--    조회할 필요는 없다)
-- ------------------------------------------------------------
alter table public.availabilities enable row level security;

create policy "availabilities_select_self_or_admin"
on public.availabilities for select
using (
  exists (
    select 1 from public.members m
    where m.id = availabilities.member_id
      and (
        m.user_id = auth.uid()
        or (m.team_id = public.current_member_team_id() and public.is_current_user_admin())
      )
  )
);

create policy "availabilities_write_self_only"
on public.availabilities for all
using (
  exists (
    select 1 from public.members m
    where m.id = availabilities.member_id and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.members m
    where m.id = availabilities.member_id and m.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------
-- tasks: 같은 팀은 조회, 쓰기는 관리자만
-- ------------------------------------------------------------
alter table public.tasks enable row level security;

create policy "tasks_select_same_team"
on public.tasks for select
using (team_id = public.current_member_team_id());

create policy "tasks_write_admin_only"
on public.tasks for all
using (team_id = public.current_member_team_id() and public.is_current_user_admin())
with check (team_id = public.current_member_team_id() and public.is_current_user_admin());

-- ------------------------------------------------------------
-- task_required_skills: tasks와 동일한 권한을 상속
-- ------------------------------------------------------------
alter table public.task_required_skills enable row level security;

create policy "task_required_skills_select_same_team"
on public.task_required_skills for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_required_skills.task_id
      and t.team_id = public.current_member_team_id()
  )
);

create policy "task_required_skills_write_admin_only"
on public.task_required_skills for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = task_required_skills.task_id
      and t.team_id = public.current_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = task_required_skills.task_id
      and t.team_id = public.current_member_team_id()
  )
);

-- ------------------------------------------------------------
-- assignments
--   - 조회: 같은 팀 전체(팀원은 본인 배정 확인, 관리자는 전체 배정 현황 확인)
--   - 배정/재배정/삭제(insert/update/delete): 관리자만 (D&D, 자동배정은 PC 전용)
--   - 완료 체크는 아래 mark_assignment_completed() 함수로만 허용한다
--     (테이블 UPDATE를 팀원에게 직접 열어주면 member_id, skill_override 등
--      다른 컬럼까지 임의로 바꿀 수 있어 컬럼 단위 통제가 필요했다)
-- ------------------------------------------------------------
alter table public.assignments enable row level security;

create policy "assignments_select_same_team"
on public.assignments for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_member_team_id()
  )
);

create policy "assignments_write_admin_only"
on public.assignments for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_member_team_id()
  )
);

create or replace function public.mark_assignment_completed(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.assignments
  set status = 'COMPLETED', updated_at = now()
  where id = p_assignment_id
    and status = 'ASSIGNED'
    and member_id in (
      select id from public.members where user_id = auth.uid()
    );

  if not found then
    raise exception '완료 체크할 수 있는 배정 건을 찾을 수 없습니다.';
  end if;
end;
$$;

grant execute on function public.mark_assignment_completed(uuid) to authenticated;

-- 휴가 등록 시 이미 배정된 과업을 "공백" 상태로 자동 전환한다 (PRD 3.7).
-- 팀원은 assignments 테이블에 대한 UPDATE 권한이 없으므로(assignments_write_admin_only가
-- 관리자 전용) 이 SECURITY DEFINER 함수로만 전환을 허용한다. member_id는 클라이언트 입력을
-- 신뢰하지 않고 auth.uid()로 직접 도출해, 본인의 배정만 전환할 수 있도록 제한한다.
create or replace function public.apply_vacation_gaps(p_dates date[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  select id into v_member_id from public.members where user_id = auth.uid();

  if v_member_id is null then
    raise exception '팀에 소속된 사용자만 사용할 수 있습니다.';
  end if;

  update public.assignments
  set status = 'EMPTY', updated_at = now()
  where member_id = v_member_id
    and date = any(p_dates)
    and status = 'ASSIGNED';
end;
$$;

grant execute on function public.apply_vacation_gaps(date[]) to authenticated;
