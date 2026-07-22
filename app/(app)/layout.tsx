import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeviceGuard from '@/components/DeviceGuard'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 팀이 있는지 확인 (온보딩 제외 경로에서)
  return (
    <DeviceGuard>
      {children}
    </DeviceGuard>
  )
}
