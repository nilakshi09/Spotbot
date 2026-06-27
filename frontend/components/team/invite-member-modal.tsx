'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Mail, Shield, User } from 'lucide-react'
import { useInviteMember } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import type { MemberRole } from '@/types/team'

interface InviteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberModal({
  open,
  onOpenChange,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('member')
  const [emailError, setEmailError] = useState('')
  const [success, setSuccess] = useState(false)
  const inviteMember = useInviteMember()
  const { toast } = useToast()

  function validateEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  async function handleSubmit() {
    if (!validateEmail(email)) return

    try {
      await inviteMember.mutateAsync({ email, role })
      setSuccess(true)
      setEmail('')
      setRole('member')
    } catch (err: any) {
      if (err.code === 'CONFLICT') {
        setEmailError(err.message)
      } else {
        toast.error(err.message ?? 'Failed to send invitation')
      }
    }
  }

  function handleClose() {
    setEmail('')
    setRole('member')
    setEmailError('')
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60
          backdrop-blur-sm z-50" />

        <Dialog.Content className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-md z-50
          bg-gray-900 border border-white/10 rounded-2xl
          p-6 shadow-2xl
        ">
          <Dialog.Title className="text-lg font-semibold text-white mb-1">
            Invite Team Member
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-400 mb-6">
            They'll receive an email with a link to join your organization
          </Dialog.Description>

          {success ? (
            // Success state
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📨</div>
              <div className="text-white font-medium mb-2">
                Invitation sent!
              </div>
              <div className="text-gray-400 text-sm mb-6">
                An invitation email has been sent to{' '}
                <span className="text-white">{email}</span>.
                The link expires in 48 hours.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="flex-1 py-2.5 border border-white/10
                    text-gray-300 hover:text-white rounded-xl
                    text-sm transition-colors"
                >
                  Invite Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-indigo-600
                    hover:bg-indigo-500 text-white rounded-xl
                    text-sm font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Form state
            <div className="space-y-5">
              {/* Email input */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3
                    top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) validateEmail(e.target.value)
                    }}
                    placeholder="colleague@agency.com"
                    className={`w-full pl-9 pr-4 py-2.5 bg-white/5
                      border rounded-xl text-white text-sm
                      placeholder:text-gray-600 outline-none
                      focus:border-indigo-500 transition-colors
                      ${emailError
                        ? 'border-red-400'
                        : 'border-white/10'
                      }`}
                  />
                </div>
                {emailError && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Role selector */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Member option */}
                  <button
                    onClick={() => setRole('member')}
                    className={`p-4 rounded-xl border text-left
                      transition-colors ${
                      role === 'member'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <User size={16} className={`mb-2 ${
                      role === 'member'
                        ? 'text-indigo-400'
                        : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-white">
                      Member
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Can run scans and view own reports
                    </div>
                  </button>

                  {/* Admin option */}
                  <button
                    onClick={() => setRole('admin')}
                    className={`p-4 rounded-xl border text-left
                      transition-colors ${
                      role === 'admin'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <Shield size={16} className={`mb-2 ${
                      role === 'admin'
                        ? 'text-indigo-400'
                        : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-white">
                      Admin
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Can manage team and see all scans
                    </div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Dialog.Close asChild>
                  <button className="flex-1 py-2.5 border
                    border-white/10 text-gray-300 hover:text-white
                    rounded-xl text-sm transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleSubmit}
                  disabled={inviteMember.isPending || !email}
                  className="flex-1 py-2.5 bg-indigo-600
                    hover:bg-indigo-500 disabled:opacity-50
                    text-white font-medium rounded-xl text-sm
                    transition-colors flex items-center
                    justify-center gap-2"
                >
                  {inviteMember.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2
                        border-white/30 border-t-white rounded-full
                        animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
