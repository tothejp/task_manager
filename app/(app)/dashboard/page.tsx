import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/get-current-member'

// 로그인 후 라우팅 허브: 별도 UI 없이 역할/상태에 맞는 화면으로 즉시 이동
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const member = await getCurrentMember()
  if (!member) redirect('/onboarding')
  if (member.status === 'pending') redirect('/pending')
  redirect(member.role === 'admin' ? '/admin' : '/schedule')
}
