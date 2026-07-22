import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">임무분담표</h1>
        <p className="text-sm text-center text-gray-500 mb-8">시작하려면 팀이 필요합니다.</p>

        <div className="space-y-3">
          <Link
            href="/team/new"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            새 팀 만들기
          </Link>
          <Link
            href="/join"
            className="block w-full bg-white text-gray-900 text-center py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            초대 코드로 팀 합류하기
          </Link>
        </div>
      </div>
    </div>
  )
}
