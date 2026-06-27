'use client'

import { X, Clock } from 'lucide-react'
import { useRevokeInvitation } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/format'
import type { PendingInvitation } from '@/types/team'

interface PendingInvitationsTableProps {
  invitations: PendingInvitation[]
}

export function PendingInvitationsTable({
  invitations,
}: PendingInvitationsTableProps) {
  const revokeInvitation = useRevokeInvitation()
  const { toast } = useToast()

  async function handleRevoke(invitation: PendingInvitation) {
    try {
      await revokeInvitation.mutateAsync(invitation.id)
      toast.success(`Invitation to ${invitation.email} revoked`)
    } catch {
      toast.error('Failed to revoke invitation')
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl
      overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center
        justify-between">
        <h2 className="text-base font-semibold text-white">
          Pending Invitations
        </h2>
        <span className="text-xs text-amber-400 bg-amber-400/10
          border border-amber-400/20 px-2 py-0.5 rounded-full">
          {invitations.length} pending
        </span>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left px-6 py-3 text-xs text-gray-500
              uppercase tracking-wider">
              Email
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500
              uppercase tracking-wider hidden sm:table-cell">
              Role
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500
              uppercase tracking-wider hidden sm:table-cell">
              Expires
            </th>
            <th className="px-6 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {invitations.map(invitation => (
            <tr
              key={invitation.id}
              className="border-b border-white/5 hover:bg-white/3
                transition-colors"
            >
              {/* Email */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full
                    bg-white/5 border border-white/10
                    flex items-center justify-center">
                    <Clock size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm text-white">
                      {invitation.email}
                    </div>
                    <div className="text-xs text-amber-400">
                      Invitation pending
                    </div>
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="px-6 py-4 hidden sm:table-cell">
                <span className="text-xs text-gray-400 capitalize">
                  {invitation.role}
                </span>
              </td>

              {/* Expires */}
              <td className="px-6 py-4 hidden sm:table-cell">
                <span className="text-xs text-gray-500">
                  {timeAgo(invitation.expiresAt)}
                </span>
              </td>

              {/* Revoke */}
              <td className="px-6 py-4">
                <button
                  onClick={() => handleRevoke(invitation)}
                  disabled={revokeInvitation.isPending}
                  className="p-1.5 rounded-lg text-gray-500
                    hover:text-red-400 hover:bg-red-400/5
                    transition-colors disabled:opacity-50"
                  title="Revoke invitation"
                >
                  <X size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
