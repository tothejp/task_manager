'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get('password') as string,
  })

  if (error || !data.user) {
    // 관리자 승인제라 외부인이 임의로 가입할 수 없어, 계정 존재 여부를 알려주는
    // 리스크(사용자 열거)보다 안내 정확성을 우선함 — supabase/email_lookup_rpc.sql 참고.
    const { data: registered } = await supabase.rpc('is_email_registered', { p_email: email })
    return {
      error: registered ? '비밀번호가 일치하지 않습니다.' : '등록된 아이디가 없습니다.',
    }
  }

  // /dashboard를 거쳐 한 번 더 리다이렉트하면 페이지 렌더 사이클이 통째로 한 번 더 도므로,
  // 로그인 시점에 이미 알고 있는 유저 정보로 최종 목적지를 바로 계산해서 이동한다.
  const { data: member } = await supabase
    .from('members')
    .select('status, role')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (!member) redirect('/onboarding')
  if (member.status === 'pending') redirect('/pending')
  redirect(member.role === 'admin' ? '/admin' : '/schedule')
}
