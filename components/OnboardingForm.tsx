'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { joinExistingTeam } from '@/app/(app)/onboarding/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? '신청 중...' : '합류 신청'}
    </button>
  )
}

export function OnboardingForm({ teams }: { teams: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(joinExistingTeam, null)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
        )}

        <div>
          <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
            팀 선택
          </label>
          <select
            id="teamId"
            name="teamId"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">팀을 선택하세요</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
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

      <p className="text-xs text-center text-gray-500 mt-4">
        신청 후 관리자 승인이 완료되면 이용하실 수 있습니다.
      </p>
    </div>
  )
}
