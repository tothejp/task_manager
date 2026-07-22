-- teams/members/skill_tags/tasks/assignments/availabilities 테이블의 id 컬럼(및 teams/members의
-- updated_at)에 DB 기본값이 아예 없어서 앱의 거의 모든 insert가 NOT NULL 위반으로 실패하고 있었다.
-- BookLog 쪽 테이블(books, profiles 등)은 전부 gen_random_uuid() 기본값이 있는데 TaskShare 테이블만
-- 스키마 생성 시 누락된 것으로 보인다. superadmin.sql보다 먼저 실행할 것.

alter table public.teams alter column id set default gen_random_uuid();
alter table public.teams alter column updated_at set default now();

alter table public.members alter column id set default gen_random_uuid();
alter table public.members alter column updated_at set default now();

alter table public.skill_tags alter column id set default gen_random_uuid();
alter table public.tasks alter column id set default gen_random_uuid();
alter table public.assignments alter column id set default gen_random_uuid();
alter table public.availabilities alter column id set default gen_random_uuid();
