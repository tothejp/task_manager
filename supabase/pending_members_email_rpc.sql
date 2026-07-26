-- 조직원 관리(/admin/organization) 화면에서 가입 승인 대기자의 계정(이메일)을 함께 보여주기 위한 RPC.
-- members 테이블엔 email이 없고(auth.users에만 존재), 클라이언트 Supabase 키로는 auth.users를
-- 직접 조회할 수 없으므로 SECURITY DEFINER 함수로 좁게 노출한다.
-- p_team_id는 호출측(앱)이 이미 resolveEffectiveTeamId로 계산한 값을 넘기지만,
-- 함수 내부에서 호출자가 실제로 그 팀의 관리자이거나 슈퍼관리자인지 다시 검증한다.
create or replace function public.list_pending_members_for_team(p_team_id uuid)
returns table(id uuid, name text, email text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select m.id, m.name, u.email, m.created_at
  from public.members m
  join auth.users u on u.id = m.user_id
  where m.status = 'pending'
    and m.team_id = p_team_id
    and (
      (public.is_current_user_admin() and p_team_id = public.current_active_member_team_id())
      or public.is_superadmin()
    )
  order by m.created_at;
$$;

grant execute on function public.list_pending_members_for_team(uuid) to authenticated;
