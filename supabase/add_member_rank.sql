-- 조직원 정보에 계급(이병/일병/상병/병장) 추가.
-- 컬럼명을 rank로 하면 PostgreSQL의 순서집합 집계함수 rank()와 충돌해
-- "WITHIN GROUP is required for ordered-set aggregate rank" 파싱 에러가 나므로
-- member_rank로 이름을 피해서 만든다(앱 코드에서는 select 시 rank:member_rank로 별칭 처리).
-- 기존 인원은 계급 미지정 상태(null)로 두고, 조직원 관리 화면에서 관리자가 채워 넣는다.
create type public.member_rank_enum as enum ('이병', '일병', '상병', '병장');

alter table public.members
  add column member_rank public.member_rank_enum;
