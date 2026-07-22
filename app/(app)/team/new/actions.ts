'use server'

import { randomUUID } from 'crypto'
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

  // 팀 ID를 미리 생성해서 삽입한다. .select()로 방금 만든 행을 바로 읽어오면
  // teams_select_own_team 정책(본인이 이미 그 팀의 members여야 함)을 만족하지
  // 못해 실패하므로(팀 생성 시점엔 아직 members 행이 없음), RETURNING 없이 insert한다.
  const teamId = randomUUID()

  const { error: teamError } = await supabase
    .from('teams')
    .insert({ id: teamId, name: teamName, created_by: user.id })

  if (teamError) return { error: '팀 생성에 실패했습니다.' }

  // 관리자 구성원 등록
  const { error: memberError } = await supabase
    .from('members')
    .insert({ team_id: teamId, user_id: user.id, role: 'admin', status: 'active', name: memberName })

  if (memberError) return { error: '구성원 등록에 실패했습니다.' }

  // 초대 코드 발급 (7일 유효)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await supabase.from('invitations').insert({
    team_id: teamId,
    code: generateInviteCode(),
    expires_at: expiresAt.toISOString(),
  })

  redirect('/dashboard')
}
