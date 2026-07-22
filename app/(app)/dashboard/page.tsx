import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('*, teams(name)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/onboarding')

  const team = (member as any).teams

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{team?.name}</h1>
            <p className="text-sm text-gray-500">
              {member.name} · {member.role === 'admin' ? '관리자' : '팀원'}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {member.role === 'admin' ? (
            <>
              <NavCard href="/admin" title="가용인원 대시보드" desc="팀원 상태 및 스킬 현황 확인" />
              <NavCard href="/admin/tasks" title="과업 관리" desc="과업 생성 및 목록 조회" />
              <NavCard href="/admin/assign" title="과업 배정" desc="드래그&드롭으로 팀원 배정" />
            </>
          ) : (
            <NavCard href="/schedule" title="내 일정 입력" desc="가용 여부·휴가·휴무 등록" />
          )}
        </div>
      </main>
    </div>
  )
}

function NavCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors"
    >
      <p className="font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-500">{desc}</p>
    </a>
  )
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        로그아웃
      </button>
    </form>
  )
}
