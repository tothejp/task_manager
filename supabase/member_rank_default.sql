-- member_rank가 null인 기존 조직원을 '이병'으로 채우고, 컬럼 자체에
-- 기본값 '이병' + NOT NULL을 설정해 이후로는 신규 조직원도 DB 레벨에서
-- 항상 값을 갖도록 한다. (기존엔 중대현황판 화면에서만 null을 '이병'으로
-- 대신 보여주는 앱 레벨 fallback이라 조직원 관리 드롭다운("계급 선택")과
-- 표시가 어긋났음 — DB에 실제로 채워 넣어 화면 간 불일치를 없앤다.)

update public.members
set member_rank = '이병'
where member_rank is null;

alter table public.members
  alter column member_rank set default '이병';

alter table public.members
  alter column member_rank set not null;
