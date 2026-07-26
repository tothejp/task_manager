import { redirect } from 'next/navigation'
import DeviceGuard from '@/components/DeviceGuard'
import { getAuthUser, getCurrentMember } from '@/lib/get-current-member'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
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
