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
-- ============================================================

-- ------------------------------------------------------------
-- 헬퍼 함수
-- SECURITY DEFINER + search_path 고정: RLS 자기참조 무한재귀 방지
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
    where user_id = auth.uid() and role = 'admin'
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

-- 팀 생성: 이미 다른 팀 소속이면 차단
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
  values (v_team.id, auth.uid(), 'admin', p_admin_name);

  return v_team;
end;
$$;

grant execute on function public.create_team_with_admin(text, text) to authenticated;

-- 초대 링크 참여
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
  values (v_team.id, auth.uid(), 'member', p_member_name);

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
-- availabilities
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
-- tasks
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
-- task_skills
-- ------------------------------------------------------------
alter table public.task_skills enable row level security;

create policy "task_skills_select_same_team"
on public.task_skills for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_member_team_id()
  )
);

create policy "task_skills_write_admin_only"
on public.task_skills for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_member_team_id()
  )
);

-- ------------------------------------------------------------
-- assignments
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

-- 팀원 완료 체크 전용 함수 (assignments UPDATE 권한 없이 status만 변경)
create or replace function public.mark_assignment_completed(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.assignments
  set status = 'completed'
  where id = p_assignment_id
    and status = 'assigned'
    and member_id in (
      select id from public.members where user_id = auth.uid()
    );

  if not found then
    raise exception '완료 체크할 수 있는 배정 건을 찾을 수 없습니다.';
  end if;
end;
$$;

grant execute on function public.mark_assignment_completed(uuid) to authenticated;

-- 휴가 등록 시 배정된 과업을 vacant 상태로 전환 (PRD 3.7)
-- assignments에 date 컬럼 없으므로 tasks 테이블을 경유한다
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
  set status = 'vacant'
  where member_id = v_member_id
    and task_id in (
      select id from public.tasks where date = any(p_dates)
    )
    and status = 'assigned';
end;
$$;

grant execute on function public.apply_vacation_gaps(date[]) to authenticated;
