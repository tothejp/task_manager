import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeviceGuard from '@/components/DeviceGuard'
import { getCurrentMember } from '@/lib/get-current-member'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const member = await getCurrentMember()

  if (member && member.status === 'active') {
    return (
      <AppShell member={member}>
        <DeviceGuard>{children}</DeviceGuard>
      </AppShell>
    )
  }

  return (
    <DeviceGuard>
      {children}
    </DeviceGuard>
  )
}
