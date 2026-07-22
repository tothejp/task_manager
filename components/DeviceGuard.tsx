'use client'

import { useDeviceType } from '@/lib/hooks/useDeviceType'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function DeviceGuard({ children }: { children: React.ReactNode }) {
  const deviceType = useDeviceType()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)

  if (deviceType === 'unknown') return <>{children}</>

  // 팀원이 PC로 접속한 경우
  if (deviceType === 'desktop' && !dismissed) {
    // 관리자 전용 경로는 PC에서만 허용 — 팀원 경로에서만 안내
    const isMemberPath = pathname.startsWith('/schedule') || pathname.startsWith('/my-tasks')
    if (isMemberPath) {
      return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">모바일에서 이용해주세요</h2>
            <p className="text-sm text-gray-500 mb-6">
              일정 입력 및 임무 확인은 모바일 환경에서 최적화되어 있습니다.
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              그래도 계속 진행하기
            </button>
          </div>
        </div>
      )
    }
  }

  // 관리자가 모바일로 배정/생성 작업 시도
  if (deviceType === 'mobile' && !dismissed) {
    const isAdminActionPath =
      pathname.startsWith('/admin/tasks') ||
      pathname.startsWith('/admin/assign')
    if (isAdminActionPath) {
      return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">💻</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">PC에서 이용해주세요</h2>
            <p className="text-sm text-gray-500 mb-6">
              배정 및 관리 기능은 PC 환경에서 이용 가능합니다.
              모바일에서는 현황 조회만 가능합니다.
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              조회만 하기
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
