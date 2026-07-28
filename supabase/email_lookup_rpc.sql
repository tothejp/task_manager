-- 로그인 실패 시 "등록된 아이디가 없습니다"와 "비밀번호가 일치하지 않습니다"를
-- 구분해서 안내하기 위한 RPC. 로그인 전(비로그인 상태, anon 역할)에도 호출해야 하므로
-- anon에게도 실행 권한을 준다.
--
-- 주의(보안 트레이드오프): 이 함수는 특정 이메일의 가입 여부를 그대로 알려주므로
-- 계정 존재 여부가 외부에 노출된다(사용자 열거 공격에 취약해짐). 이 앱은 관리자 승인제라
-- 외부인이 임의로 가입할 수 없어 리스크가 낮다고 판단해 의도적으로 허용한 것 — 다른
-- 프로젝트에 이 패턴을 그대로 재사용하지 말 것.
create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users where email = p_email
  );
$$;

grant execute on function public.is_email_registered(text) to anon, authenticated;
