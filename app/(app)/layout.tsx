import { redirect } from 'next/navigation'
import DeviceGuard from '@/components/DeviceGuard'
import { getAuthUser, getCurrentMember } from '@/lib/get-current-member'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const member = await getCurrentMember()

  if (member && member.status === 'active') {
    try {
      return await AppShell({ member, children: <DeviceGuard>{children}</DeviceGuard> })
    } catch (err) {
      return (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: 24, fontSize: 12, color: 'red' }}>
          {String(err instanceof Error ? err.stack ?? err.message : err)}
        </pre>
      )
    }
  }

  return (
    <DeviceGuard>
      {children}
    </DeviceGuard>
  )
}
