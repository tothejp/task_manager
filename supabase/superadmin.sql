-- 슈퍼관리자(tothejp) 도입 + 팀 생성 방식을 "관리자가 미리 만든 팀 중 드롭다운 선택"으로 전환.
-- 전체 스크립트를 여러 번 실행해도 안전하도록(재실행 대비) 가능한 부분은 idempotent하게 작성한다.
-- 1) 슈퍼관리자 테이블 + 헬퍼
create table if not exists public.superadmins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.superadmins enable row level security;
-- 이 테이블 자체는 아무도 직접 select 못 하게 둔다 (정책 없음 = 기본 거부).
-- 슈퍼관리자 여부 확인은 오직 아래 SECURITY DEFINER 함수로만 한다.

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.superadmins where user_id = auth.uid());
$$;
grant execute on function public.is_superadmin() to authenticated;

insert into public.superadmins (user_id) values ('9f3bf87d-5b5b-44ad-af9e-52ff442aca3e')
on conflict (user_id) do nothing;

-- 2) 온보딩용 팀 목록 조회 RPC
-- 아직 어느 팀에도 속하지 않은 사용자도 팀 이름 목록을 봐야 드롭다운을 채울 수 있다.
-- teams 테이블 SELECT 정책 자체를 풀면 invite_code 등 다른 컬럼까지 노출 위험이 있으므로,
-- id/name만 반환하는 좁은 RPC로 우회한다.
create or replace function public.list_teams_for_onboarding()
returns table(id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name from public.teams order by name;
$$;
grant execute on function public.list_teams_for_onboarding() to authenticated;

-- 3) 기존 정책에 "슈퍼관리자면 팀 무관 통과" 예외 추가

drop policy if exists "teams_select_own_team" on public.teams;
create policy "teams_select_own_team"
on public.teams for select
using (id = public.current_member_team_id() or public.is_superadmin());

drop policy if exists "teams_update_admin_only" on public.teams;
create policy "teams_update_admin_only"
on public.teams for update
using ((id = public.current_member_team_id() and public.is_current_user_admin()) or public.is_superadmin())
with check ((id = public.current_member_team_id() and public.is_current_user_admin()) or public.is_superadmin());

drop policy if exists "members_select_same_team" on public.members;
create policy "members_select_same_team"
on public.members for select
using (team_id = public.current_member_team_id() or public.is_superadmin());

drop policy if exists "members_update_admin_only" on public.members;
create policy "members_update_admin_only"
on public.members for update
using ((team_id = public.current_member_team_id() and public.is_current_user_admin()) or public.is_superadmin())
with check ((team_id = public.current_member_team_id() and public.is_current_user_admin()) or public.is_superadmin());

drop policy if exists "members_delete_admin_only" on public.members;
create policy "members_delete_admin_only"
on public.members for delete
using ((team_id = public.current_member_team_id() and public.is_current_user_admin()) or public.is_superadmin());

drop policy if exists "skill_tags_select_same_team" on public.skill_tags;
create policy "skill_tags_select_same_team"
on public.skill_tags for select
using (team_id = public.current_active_member_team_id() or public.is_superadmin());

drop policy if exists "skill_tags_write_admin_only" on public.skill_tags;
create policy "skill_tags_write_admin_only"
on public.skill_tags for all
using ((team_id = public.current_active_member_team_id() and public.is_current_user_admin()) or public.is_superadmin())
with check ((team_id = public.current_active_member_team_id() and public.is_current_user_admin()) or public.is_superadmin());

drop policy if exists "member_skills_select_same_team" on public.member_skills;
create policy "member_skills_select_same_team"
on public.member_skills for select
using (
  public.is_superadmin()
  or exists (
    select 1 from public.members m
    where m.id = member_skills.member_id
      and m.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "member_skills_write_admin_only" on public.member_skills;
create policy "member_skills_write_admin_only"
on public.member_skills for all
using (
  public.is_superadmin()
  or (
    public.is_current_user_admin()
    and exists (
      select 1 from public.members m
      where m.id = member_skills.member_id
        and m.team_id = public.current_active_member_team_id()
    )
  )
)
with check (
  public.is_superadmin()
  or (
    public.is_current_user_admin()
    and exists (
      select 1 from public.members m
      where m.id = member_skills.member_id
        and m.team_id = public.current_active_member_team_id()
    )
  )
);

drop policy if exists "tasks_select_same_team" on public.tasks;
create policy "tasks_select_same_team"
on public.tasks for select
using (team_id = public.current_active_member_team_id() or public.is_superadmin());

drop policy if exists "tasks_write_admin_only" on public.tasks;
create policy "tasks_write_admin_only"
on public.tasks for all
using ((team_id = public.current_active_member_team_id() and public.is_current_user_admin()) or public.is_superadmin())
with check ((team_id = public.current_active_member_team_id() and public.is_current_user_admin()) or public.is_superadmin());

drop policy if exists "task_skills_select_same_team" on public.task_skills;
create policy "task_skills_select_same_team"
on public.task_skills for select
using (
  public.is_superadmin()
  or exists (
    select 1 from public.tasks t
    where t.id = task_skills.task_id
      and t.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "task_skills_write_admin_only" on public.task_skills;
create policy "task_skills_write_admin_only"
on public.task_skills for all
using (
  public.is_superadmin()
  or (
    public.is_current_user_admin()
    and exists (
      select 1 from public.tasks t
      where t.id = task_skills.task_id
        and t.team_id = public.current_active_member_team_id()
    )
  )
)
with check (
  public.is_superadmin()
  or (
    public.is_current_user_admin()
    and exists (
      select 1 from public.tasks t
      where t.id = task_skills.task_id
        and t.team_id = public.current_active_member_team_id()
    )
  )
);

drop policy if exists "assignments_select_same_team" on public.assignments;
create policy "assignments_select_same_team"
on public.assignments for select
using (
  public.is_superadmin()
  or exists (
    select 1 from public.tasks t
    where t.id = assignments.task_id
      and t.team_id = public.current_active_member_team_id()
  )
);

drop policy if exists "assignments_write_admin_only" on public.assignments;
create policy "assignments_write_admin_only"
on public.assignments for all
using (
  public.is_superadmin()
  or (
    public.is_current_user_admin()
    and exists (
      select 1 from public.tasks t
      where t.id = assignments.task_id
        and t.team_id = public.current_active_member_team_id()
    )
  )
)
with check (
  public.is_superadmin()
  or (
    public.is_current_user_admin()
    and exists (
      select 1 from public.tasks t
      where t.id = assignments.task_id
        and t.team_id = public.current_active_member_team_id()
    )
  )
);

-- 4) 초기 팀 3개 생성 + tothejp을 본부중대 admin으로 등록
-- invite_code는 not null 컬럼이라 명시적으로 채운다(기존 초대코드 합류 흐름은 폐기됐으므로 값 자체는 더 이상 쓰이지 않는다).
-- 이미 같은 이름의 팀이 있으면 다시 만들지 않는다(재실행 대비).
insert into public.teams (id, name, invite_code, created_by)
select gen_random_uuid(), v.name, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)), '9f3bf87d-5b5b-44ad-af9e-52ff442aca3e'
from (values ('지원중대'), ('운용중대'), ('본부중대')) as v(name)
where not exists (select 1 from public.teams t where t.name = v.name);

insert into public.members (team_id, user_id, role, status, name)
select t.id, '9f3bf87d-5b5b-44ad-af9e-52ff442aca3e', 'admin', 'active', '관리자'
from public.teams t
where t.name = '본부중대'
  and not exists (
    select 1 from public.members m where m.user_id = '9f3bf87d-5b5b-44ad-af9e-52ff442aca3e'
  );
