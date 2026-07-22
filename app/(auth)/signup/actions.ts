'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    // TODO: 원인 진단 후 사용자 친화적 메시지로 되돌릴 것
    return { error: `[디버그] ${error.status ?? ''} ${error.message}` }
  }

  redirect('/onboarding')
}
