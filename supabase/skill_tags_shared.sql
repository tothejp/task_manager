-- 스킬 태그를 팀별 격리 자원에서 모든 중대가 공유하는 전역 카탈로그로 전환.
-- CLAUDE.md 3장의 "팀 단위 RLS 격리" 원칙에 대한 명시적 예외(사용자 요청).
-- skill_tags.team_id 컬럼 자체는 남겨두지만(스키마 NOT NULL 유지, 생성자 팀 기록용),
-- 조회는 팀 구분 없이 전체 공개하고, 쓰기(생성/수정/삭제)는 어느 팀 관리자든 가능하게 한다.
-- member_skills/task_skills는 여전히 각자의 member_id/task_id 쪽 team_id로 격리되므로
-- "누가 어떤 스킬을 보유/요구하는지"의 팀 격리는 그대로 유지된다.

drop policy if exists "skill_tags_select_same_team" on public.skill_tags;
drop policy if exists "skill_tags_write_admin_only" on public.skill_tags;

create policy "skill_tags_select_all"
on public.skill_tags for select
using (true);

create policy "skill_tags_write_admin_only"
on public.skill_tags for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
