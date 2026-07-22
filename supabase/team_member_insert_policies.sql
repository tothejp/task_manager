-- teams/members 테이블에 RLS는 켜져 있지만 INSERT 정책이 없어서
-- app/(app)/team/new/actions.ts, app/(app)/join/actions.ts의 클라이언트 측
-- .insert() 호출이 "new row violates row-level security policy"로 막히던 문제 수정.

-- 팀 생성: 본인을 created_by로 하는 팀만 생성 가능
create policy "teams_insert_self_created"
on public.teams for insert
with check (created_by = auth.uid());

-- 구성원 등록: 본인 user_id로만 등록 가능하며,
--   - admin으로 등록하려면 본인이 방금 만든(created_by=본인) 팀이어야 하고
--   - member로 등록하려면 반드시 status='pending'이어야 한다 (관리자 승인 전 활성화 방지)
create policy "members_insert_self"
on public.members for insert
with check (
  user_id = auth.uid()
  and (
    (role = 'admin' and exists (
      select 1 from public.teams t
      where t.id = members.team_id and t.created_by = auth.uid()
    ))
    or (role = 'member' and status = 'pending')
  )
);
