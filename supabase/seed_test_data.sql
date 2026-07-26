-- 로컬/스테이징에서 화면을 눈으로 확인하기 위한 테스트 데이터.
-- 본부중대(superadmin.sql이 만든 팀, tothejp이 admin으로 소속됨)에 스킬 태그와 과업을 채운다.
-- 여러 번 실행해도 중복 생성되지 않도록 NOT EXISTS로 가드한다.
--
-- 주의: members/availabilities는 여기 포함하지 않는다. members.user_id는 auth.users(id)를
-- 참조하므로 실제 회원가입(→ /onboarding 합류 → 관리자 승인) 없이는 SQL만으로 안전하게 채울 수 없다.
-- 배정/공정성 화면까지 테스트하려면 테스트 계정 2~4개를 실제로 가입시킨 뒤, 이 파일 맨 아래
-- 일괄 승인 스니펫을 사용해 승인 절차를 건너뛰면 된다.

-- 1) 스킬 태그
insert into public.skill_tags (id, team_id, name)
select gen_random_uuid(), t.id, v.name
from public.teams t
cross join (values ('구급'), ('통신'), ('운전'), ('경계')) as v(name)
where t.name = '본부중대'
  and not exists (
    select 1 from public.skill_tags s where s.team_id = t.id and s.name = v.name
  );

-- 2) 과업 (오늘부터 10일간, 시간/필요인원 다양화)
insert into public.tasks (id, team_id, title, description, date, start_time, end_time, required_headcount, updated_at)
select
  gen_random_uuid(),
  t.id,
  v.title,
  v.description,
  (current_date + v.day_offset)::date,
  v.start_time::time,
  v.end_time::time,
  v.required_headcount,
  now()
from public.teams t
cross join (
  values
    ('정문 경계',       '정문 출입 통제',            0, '08:00', '12:00', 2),
    ('정문 경계',       '정문 출입 통제',            0, '12:00', '16:00', 2),
    ('환자 이송',       '응급 환자 후송 대기',        1, '09:00', '18:00', 1),
    ('통신 점검',       '주간 통신 장비 점검',        2, '10:00', '11:00', 1),
    ('차량 운행',       '보급품 수령 운행',           3, '07:00', '09:00', 1),
    ('야간 경계',       '야간 취약시간대 경계',       3, '19:00', '23:00', 2),
    ('구급 대기',       '체력단련 구급 대기',         4, '06:00', '08:00', 1),
    ('영내 순찰',       '영내 시설 순찰',             5, '14:00', '17:00', 1),
    ('행정 지원',       '문서 정리 및 행정 지원',     6, '09:00', '17:00', 1),
    ('정문 경계',       '정문 출입 통제',             7, '08:00', '12:00', 2)
) as v(title, description, day_offset, start_time, end_time, required_headcount)
where t.name = '본부중대'
  and not exists (
    select 1 from public.tasks x
    where x.team_id = t.id and x.title = v.title and x.date = (current_date + v.day_offset)::date
      and x.start_time = v.start_time::time
  );

-- 3) 과업별 필수 스킬 (환자 이송→구급, 통신 점검→통신, 차량 운행→운전, 야간 경계→경계)
insert into public.task_skills (task_id, skill_tag_id)
select tk.id, sk.id
from public.tasks tk
join public.teams t on t.id = tk.team_id and t.name = '본부중대'
join (
  values ('환자 이송', '구급'), ('통신 점검', '통신'), ('차량 운행', '운전'), ('야간 경계', '경계')
) as v(task_title, skill_name) on v.task_title = tk.title
join public.skill_tags sk on sk.team_id = t.id and sk.name = v.skill_name
where not exists (
  select 1 from public.task_skills existing
  where existing.task_id = tk.id and existing.skill_tag_id = sk.id
);

-- ---
-- (선택) 실제 계정 2~4개를 /signup으로 가입시키고 /onboarding에서 본부중대를 선택해 합류
-- 신청까지 마친 뒤, 아래를 실행하면 관리자 승인 화면을 거치지 않고 바로 active로 전환된다.
--
-- update public.members
-- set status = 'active', updated_at = now()
-- where status = 'pending'
--   and team_id = (select id from public.teams where name = '본부중대');
