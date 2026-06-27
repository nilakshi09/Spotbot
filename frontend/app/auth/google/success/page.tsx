'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function GoogleOAuthSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { loginWithTokens } = useAuth() // Assuming loginWithTokens or modify login to accept tokens

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const isNewUser = searchParams.get('isNewUser') === 'true'

    if (!accessToken || !refreshToken) {
      router.replace('/login?error=google_failed')
      return
    }

    if (loginWithTokens) {
        loginWithTokens(accessToken, refreshToken)
          .then(() => {
            window.history.replaceState({}, '', '/auth/google/success')
            router.replace(isNewUser ? '/dashboard?welcome=true' : '/dashboard')
          })
          .catch(() => {
            router.replace('/login?error=google_failed')
          })
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-muted text-sm">
          Signing you in...
        </p>
        <div className="mt-4 w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}
