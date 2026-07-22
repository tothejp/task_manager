import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 이미 팀이 있으면 대시보드로
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (member) redirect('/dashboard')

  const { data: teams } = await supabase.rpc('list_teams_for_onboarding')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">임무분담표</h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          소속 팀을 선택하고 합류 신청해주세요.
        </p>

        <OnboardingForm teams={teams ?? []} />
      </div>
    </div>
  )
}
