'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTeamMembers } from '@/hooks/use-team'
import { MembersTable } from '@/components/team/members-table'
import { InviteMemberModal } from '@/components/team/invite-member-modal'
import { PendingInvitationsTable } from '@/components/team/pending-invitations-table'
import { UserPlus, Users } from 'lucide-react'

export default function TeamSettingsPage() {
  const { user } = useAuth()
  const { data: teamData, isLoading } = useTeamMembers()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const isAdmin = user?.role === 'admin'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your organization members and invitations
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5
              bg-indigo-600 hover:bg-indigo-500 text-white
              font-medium rounded-xl transition-colors text-sm"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        )}
      </div>

      {/* Members count card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5
        flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-500/10 border
          border-indigo-500/20 rounded-xl flex items-center
          justify-center">
          <Users size={20} className="text-indigo-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-white">
            {isLoading ? '—' : teamData?.totalCount ?? 0}
          </div>
          <div className="text-sm text-gray-400">
            Active {teamData?.totalCount === 1 ? 'member' : 'members'}
          </div>
        </div>
        {teamData?.pendingInvitations &&
          teamData.pendingInvitations.length > 0 && (
          <div className="ml-auto">
            <span className="text-xs bg-amber-400/10 border
              border-amber-400/20 text-amber-400 px-2 py-1 rounded-full">
              {teamData.pendingInvitations.length} pending{' '}
              {teamData.pendingInvitations.length === 1
                ? 'invitation'
                : 'invitations'}
            </span>
          </div>
        )}
      </div>

      {/* Active Members Table */}
      <MembersTable
        members={teamData?.members ?? []}
        currentUserId={user?.id ?? ''}
        isAdmin={isAdmin}
        isLoading={isLoading}
      />

      {/* Pending Invitations */}
      {isAdmin &&
        teamData?.pendingInvitations &&
        teamData.pendingInvitations.length > 0 && (
        <PendingInvitationsTable
          invitations={teamData.pendingInvitations}
        />
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  )
}
