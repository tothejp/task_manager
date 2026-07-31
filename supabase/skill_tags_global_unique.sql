-- 능력(스킬) 태그 이름을 팀 구분 없이 전역으로 유일하게 만든다.
-- 기존엔 (team_id, name) 유니크라 서로 다른 팀이 같은 이름으로 능력 태그를
-- 만들면 전역 목록에 동일 이름이 중복으로 보일 수 있었음(알려진 제약으로 남겨뒀던 것).

-- 1) 이름이 같은 중복 태그가 있다면 가장 먼저 만들어진 것만 남기고, 나머지를
--    참조하던 member_skills/task_skills를 살아남는 태그로 옮긴 뒤 중복 태그를 삭제한다.
--    (이미 살아남는 태그를 보유/요구하고 있어 옮기면 PK가 충돌하는 행은 건너뛴다 —
--    삭제 시 cascade로 자연히 정리되며, 정보 손실 없이 사실상 같은 결과가 된다.)
with duplicates as (
  select id, name, first_value(id) over (partition by name order by created_at, id) as keep_id
  from public.skill_tags
),
to_merge as (
  select id, keep_id from duplicates where id <> keep_id
)
update public.member_skills ms
set skill_tag_id = tm.keep_id
from to_merge tm
where ms.skill_tag_id = tm.id
  and not exists (
    select 1 from public.member_skills ms2
    where ms2.member_id = ms.member_id and ms2.skill_tag_id = tm.keep_id
  );

with duplicates as (
  select id, name, first_value(id) over (partition by name order by created_at, id) as keep_id
  from public.skill_tags
),
to_merge as (
  select id, keep_id from duplicates where id <> keep_id
)
update public.task_skills ts
set skill_tag_id = tm.keep_id
from to_merge tm
where ts.skill_tag_id = tm.id
  and not exists (
    select 1 from public.task_skills ts2
    where ts2.task_id = ts.task_id and ts2.skill_tag_id = tm.keep_id
  );

with duplicates as (
  select id, name, first_value(id) over (partition by name order by created_at, id) as keep_id
  from public.skill_tags
)
delete from public.skill_tags
where id in (select id from duplicates where id <> keep_id);

-- 2) 기존 (team_id, name) 유니크 제약을 name 단독 전역 유니크로 교체.
--    (제약 이름이 다를 수 있어 IF EXISTS로 안전하게 시도 — 못 지워도 새 제약이
--    더 강하므로 문제없이 공존한다.)
alter table public.skill_tags drop constraint if exists skill_tags_team_id_name_key;
alter table public.skill_tags add constraint skill_tags_name_key unique (name);
