'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function createTeam(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const teamName = (formData.get('teamName') as string).trim()
  const memberName = (formData.get('memberName') as string).trim()

  if (!teamName || !memberName) return { error: '팀 이름과 이름을 입력해주세요.' }

  // 팀 생성
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name: teamName, created_by: user.id })
    .select()
    .single()

  // TODO: 원인 진단 후 사용자 친화적 메시지로 되돌릴 것
  if (teamError || !team) {
    const { data: sessionData } = await supabase.auth.getSession()
    return {
      error: `[디버그:team] ${teamError?.code ?? ''} ${teamError?.message ?? '데이터 없음'} | user.id=${user.id} | session.user.id=${sessionData.session?.user?.id ?? '없음'} | expires_at=${sessionData.session?.expires_at ?? '없음'}`,
    }
  }

  // 관리자 구성원 등록
  const { error: memberError } = await supabase
    .from('members')
    .insert({ team_id: team.id, user_id: user.id, role: 'admin', status: 'active', name: memberName })

  if (memberError) return { error: `[디버그:member] ${memberError.code} ${memberError.message}` }

  // 초대 코드 발급 (7일 유효)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await supabase.from('invitations').insert({
    team_id: team.id,
    code: generateInviteCode(),
    expires_at: expiresAt.toISOString(),
  })

  redirect('/dashboard')
}
