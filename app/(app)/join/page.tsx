'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { joinTeam } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? '합류 중...' : '팀 합류하기'}
    </button>
  )
}

export default function JoinPage() {
  const [state, formAction] = useFormState(joinTeam, null)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">팀 합류하기</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                초대 코드
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>

            <div>
              <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-1">
                내 이름 <span className="text-gray-400 font-normal">(팀 내 표시 이름)</span>
              </label>
              <input
                id="memberName"
                name="memberName"
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <SubmitButton />
          </form>
        </div>

        <p className="text-sm text-center text-gray-500 mt-4">
          <Link href="/onboarding" className="text-blue-600 hover:underline">
            뒤로 가기
          </Link>
        </p>
      </div>
    </div>
  )
}
