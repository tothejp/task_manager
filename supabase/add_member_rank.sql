-- 조직원 정보에 계급(이병/일병/상병/병장) 추가.
-- 기존 인원은 계급 미지정 상태(null)로 두고, 조직원 관리 화면에서 관리자가 채워 넣는다.
create type public.member_rank as enum ('이병', '일병', '상병', '병장');

alter table public.members
  add column rank public.member_rank;
