'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useInvitationDetails, useAcceptInvitation } from '@/hooks/use-team'
import type { AcceptInvitationResponse } from '@/types/team'
import { useAuth } from '@/contexts/auth-context'
import { Shield, User, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuth()
  const token = searchParams.get('token') ?? ''

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    data: invitation,
    isLoading,
    error,
  } = useInvitationDetails(token)

  const acceptInvitation = useAcceptInvitation()

  // If no token, redirect to home
  useEffect(() => {
    if (!token || token.length !== 64) {
      router.replace('/')
    }
  }, [token])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!name || name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleAccept() {
    if (!validate()) return

    try {
      const result = (await acceptInvitation.mutateAsync({
        token,
        name,
        password,
      })) as AcceptInvitationResponse

      if (result.isNewUser && result.accessToken) {
        // Auto-login new user
        await login(result.accessToken, result.refreshToken!)
        router.push('/dashboard')
      } else {
        // Existing user — redirect to login
        router.push('/login?invited=true')
      }
    } catch (err: any) {
      setErrors({ submit: err.message ?? 'Failed to accept invitation' })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <InviteLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-white/5 rounded-lg" />
          <div className="h-4 bg-white/5 rounded-lg w-3/4" />
          <div className="h-12 bg-white/5 rounded-xl" />
        </div>
      </InviteLayout>
    )
  }

  // Error state (invalid/expired token)
  if (error || !invitation) {
    return (
      <InviteLayout>
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            This invitation link is invalid or has expired.
            Please ask your admin to send a new invitation.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500
              text-white font-medium rounded-xl transition-colors
              text-sm"
          >
            Go to Spotbot
          </Link>
        </div>
      </InviteLayout>
    )
  }

  return (
    <InviteLayout>
      <div className="space-y-6">
        {/* Invitation info */}
        <div className="text-center">
          <div className="text-3xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-white mb-2">
            You're invited to join
          </h2>
          <div className="text-indigo-400 font-semibold text-lg mb-1">
            {invitation.orgName}
          </div>
          <p className="text-gray-400 text-sm">
            {invitation.inviterName} has invited you as a{' '}
            <span className="text-white">{invitation.role}</span>
          </p>
        </div>

        {/* Role card */}
        <div className="bg-white/5 border border-white/10 rounded-xl
          p-4 flex items-center gap-3">
          {invitation.role === 'admin' ? (
            <Shield size={18} className="text-indigo-400 shrink-0" />
          ) : (
            <User size={18} className="text-gray-400 shrink-0" />
          )}
          <div>
            <div className="text-sm font-medium text-white capitalize">
              {invitation.role} Access
            </div>
            <div className="text-xs text-gray-500">
              {invitation.role === 'admin'
                ? 'Full access — manage team, view all scans'
                : 'Standard access — run scans, view own reports'}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Email (pre-filled, read-only) */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={invitation.email}
              readOnly
              className="w-full px-4 py-2.5 bg-white/3
                border border-white/10 rounded-xl text-gray-400
                text-sm cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={`w-full px-4 py-2.5 bg-white/5
                border rounded-xl text-white text-sm
                placeholder:text-gray-600 outline-none
                focus:border-indigo-500 transition-colors
                ${errors.name ? 'border-red-400' : 'border-white/10'}`}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`w-full px-4 py-2.5 pr-10 bg-white/5
                  border rounded-xl text-white text-sm
                  placeholder:text-gray-600 outline-none
                  focus:border-indigo-500 transition-colors
                  ${errors.password
                    ? 'border-red-400'
                    : 'border-white/10'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                  text-gray-500 hover:text-white transition-colors"
              >
                {showPassword
                  ? <EyeOff size={16} />
                  : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-400/10 border border-red-400/20
              rounded-xl px-4 py-3 text-red-400 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleAccept}
            disabled={acceptInvitation.isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500
              disabled:opacity-50 text-white font-semibold
              rounded-xl transition-colors flex items-center
              justify-center gap-2"
          >
            {acceptInvitation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30
                  border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              'Accept & Create Account'
            )}
          </button>
        </div>

        {/* Already have account */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href={`/login?invited=true&email=${encodeURIComponent(invitation.email)}`}
            className="text-indigo-400 hover:text-indigo-300
              transition-colors"
          >
            Log in instead
          </Link>
        </p>
      </div>
    </InviteLayout>
  )
}

// ─── INVITE LAYOUT ────────────────────────────────────────────────────────────

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center
      justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-indigo-400">
            SPOTBOT
          </span>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
