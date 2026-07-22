-- members.status: 초대코드로 합류한 팀원은 'pending'으로 시작, 관리자 승인 시 'active'로 전환.
-- 팀 생성자(관리자)는 기본값 'active'로 즉시 활성화된다.
-- 이메일 인증 대신 관리자 승인으로 대체하기 위한 변경 (Supabase 대시보드에서 Confirm email도 꺼야 함).
create type public.member_status as enum ('active', 'pending');

alter table public.members
  add column status public.member_status not null default 'active';

-- 활성(active) 멤버만 팀 소속으로 인정하는 헬퍼. 승인 전 팀원은 팀 운영 데이터(과업/배정/스킬 등)를
-- 못 보게 하기 위해 기존 current_member_team_id() 대신 이 헬퍼로 교체한다.
-- teams/members SELECT는 그대로 둔다 (대기 화면에 팀 이름 표시, 관리자가 대기자 이름 조회 필요).
create or replace function public.current_active_member_team_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select team_id from public.members where user_id = auth.uid() and status = 'active' limit 1;
$$;

drop policy if exists "skill_tags_select_same_team" on public.skill_tags;
create policy "skill_tags_select_same_team"
on public.skill_tags for select
using (team_id = public.current_active_member_team_id());

drop policy if exists "skill_tags_write_admin_only" on public.skill_tags;
create policy "skill_tags_write_admin_only"
on public.skill_tags for all
using (team_id = public.current_active_member_team_id() and public.is_current_user_admin())
with check (team_id = public.current_active_member_team_id() and public.is_current_user_admin());

drop policy if exists "member_skills_select_same_team" on public.member_skills;
create policy "member_skills_select_same_team"
on public.member_skills for select
using (
  exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "member_skills_write_admin_only" on public.member_skills;
create policy "member_skills_write_admin_only"
on public.member_skills for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_active_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "tasks_select_same_team" on public.tasks;
create policy "tasks_select_same_team"
on public.tasks for select
using (team_id = public.current_active_member_team_id());

drop policy if exists "tasks_write_admin_only" on public.tasks;
create policy "tasks_write_admin_only"
on public.tasks for all
using (team_id = public.current_active_member_team_id() and public.is_current_user_admin())
with check (team_id = public.current_active_member_team_id() and public.is_current_user_admin());

drop policy if exists "task_skills_select_same_team" on public.task_skills;
create policy "task_skills_select_same_team"
on public.task_skills for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "task_skills_write_admin_only" on public.task_skills;
create policy "task_skills_write_admin_only"
on public.task_skills for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_active_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "assignments_select_same_team" on public.assignments;
create policy "assignments_select_same_team"
on public.assignments for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "assignments_write_admin_only" on public.assignments;
create policy "assignments_write_admin_only"
on public.assignments for all
using (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_active_member_team_id()
  )
)
with check (
  public.is_current_user_admin()
  and exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_active_member_team_id()
  )
);
