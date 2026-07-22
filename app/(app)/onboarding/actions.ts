'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function joinExistingTeam(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const teamId = formData.get('teamId') as string
  const memberName = (formData.get('memberName') as string).trim()

  if (!teamId || !memberName) return { error: '팀과 이름을 입력해주세요.' }

  // 관리자 승인 전까지는 pending 상태 (이메일 인증 대신 관리자 승인 방식)
  const { error } = await supabase
    .from('members')
    .insert({ team_id: teamId, user_id: user.id, role: 'member', status: 'pending', name: memberName })

  if (error) return { error: '합류 신청에 실패했습니다.' }

  redirect('/dashboard')
}
