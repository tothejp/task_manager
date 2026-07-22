'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function joinTeam(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const code = (formData.get('code') as string).trim().toUpperCase()
  const memberName = (formData.get('memberName') as string).trim()

  if (!code || !memberName) return { error: '초대 코드와 이름을 입력해주세요.' }

  // RPC로 초대 코드 검증 (SECURITY DEFINER 함수)
  const { data, error: rpcError } = await supabase.rpc('validate_invitation', { p_code: code })

  if (rpcError || !data?.valid) {
    return { error: data?.error ?? '유효하지 않거나 만료된 초대 코드입니다.' }
  }

  const teamId = data.team_id as string

  // 이미 팀 구성원인지 확인
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { error: '이미 해당 팀의 구성원입니다.' }

  // 팀원으로 등록 (이메일 인증 대신 관리자 승인을 거치므로 pending으로 시작)
  const { error: memberError } = await supabase
    .from('members')
    .insert({ team_id: teamId, user_id: user.id, role: 'member', status: 'pending', name: memberName })

  if (memberError) return { error: '팀 합류에 실패했습니다.' }

  redirect('/pending')
}
