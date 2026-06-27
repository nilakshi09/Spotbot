'use client'

import { useState } from 'react'
import { Shield, User, MoreVertical, Trash2, ArrowUpDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useRemoveMember, useChangeMemberRole } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/format'
import type { TeamMember, MemberRole } from '@/types/team'

interface MembersTableProps {
  members: TeamMember[]
  currentUserId: string
  isAdmin: boolean
  isLoading: boolean
}

export function MembersTable({
  members,
  currentUserId,
  isAdmin,
  isLoading,
}: MembersTableProps) {
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null)
  const removeMember = useRemoveMember()
  const changeRole = useChangeMemberRole()
  const { toast } = useToast()

  async function handleRemove() {
    if (!confirmRemove) return
    try {
      await removeMember.mutateAsync(confirmRemove.id)
      toast.success(`${confirmRemove.name} has been removed`)
      setConfirmRemove(null)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove member')
    }
  }

  async function handleRoleChange(userId: string, newRole: MemberRole) {
    try {
      await changeRole.mutateAsync({ userId, role: newRole })
      toast.success('Role updated successfully')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update role')
    }
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl
        overflow-hidden">

        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">
            Members
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs
                  text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left px-6 py-3 text-xs
                  text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs
                  text-gray-500 uppercase tracking-wider
                  hidden sm:table-cell">
                  Joined
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 w-10" />
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-6 py-4" colSpan={4}>
                      <SkeletonRow />
                    </td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8
                    text-center text-gray-500 text-sm">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isCurrentUser={member.id === currentUserId}
                    isAdmin={isAdmin}
                    onRemove={() => setConfirmRemove(member)}
                    onRoleChange={(role) =>
                      handleRoleChange(member.id, role)
                    }
                    isChangingRole={changeRole.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remove confirmation dialog */}
      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(open: boolean) => !open && setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.name}?`}
        description={
          `${confirmRemove?.name} will lose access to your ` +
          `organization immediately. They will be moved to a ` +
          `personal free account.`
        }
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleRemove}
        isLoading={removeMember.isPending}
      />
    </>
  )
}

// ─── MEMBER ROW ──────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  isAdmin,
  onRemove,
  onRoleChange,
  isChangingRole,
}: {
  member: TeamMember
  isCurrentUser: boolean
  isAdmin: boolean
  onRemove: () => void
  onRoleChange: (role: MemberRole) => void
  isChangingRole: boolean
}) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/3
      transition-colors">

      {/* Member info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br
            from-indigo-500 to-purple-600 flex items-center
            justify-center text-white text-xs font-semibold shrink-0">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-white flex
              items-center gap-2">
              {member.name}
              {isCurrentUser && (
                <span className="text-xs text-gray-500">(you)</span>
              )}
            </div>
            <div className="text-xs text-gray-500">{member.email}</div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        <RoleBadge role={member.role} />
      </td>

      {/* Joined */}
      <td className="px-6 py-4 hidden sm:table-cell">
        <span className="text-xs text-gray-500">
          {timeAgo(member.createdAt)}
        </span>
      </td>

      {/* Actions — admin only, not for current user */}
      {isAdmin && (
        <td className="px-6 py-4">
          {!isCurrentUser && (
            <MemberActionsMenu
              member={member}
              onRemove={onRemove}
              onRoleChange={onRoleChange}
              isChangingRole={isChangingRole}
            />
          )}
        </td>
      )}
    </tr>
  )
}

// ─── ROLE BADGE ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5
        text-xs bg-indigo-400/10 text-indigo-400 border
        border-indigo-400/20 rounded-full">
        <Shield size={10} />
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5
      text-xs bg-gray-400/10 text-gray-400 border
      border-gray-400/20 rounded-full">
      <User size={10} />
      Member
    </span>
  )
}

// ─── MEMBER ACTIONS MENU ─────────────────────────────────────────────────────

function MemberActionsMenu({
  member,
  onRemove,
  onRoleChange,
  isChangingRole,
}: {
  member: TeamMember
  onRemove: () => void
  onRoleChange: (role: MemberRole) => void
  isChangingRole: boolean
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-1.5 rounded-lg text-gray-500
          hover:text-white hover:bg-white/10 transition-colors">
          <MoreVertical size={14} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-gray-900 border border-white/10
            rounded-xl shadow-2xl p-1 min-w-[160px] z-50"
          align="end"
        >
          {/* Change role option */}
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm
              text-gray-300 hover:text-white hover:bg-white/5
              rounded-lg cursor-pointer transition-colors outline-none"
            onSelect={() =>
              onRoleChange(
                member.role === 'admin' ? 'member' : 'admin'
              )
            }
            disabled={isChangingRole}
          >
            <ArrowUpDown size={14} />
            Make {member.role === 'admin' ? 'Member' : 'Admin'}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 border-t border-white/10" />

          {/* Remove option */}
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm
              text-red-400 hover:text-red-300 hover:bg-red-400/5
              rounded-lg cursor-pointer transition-colors outline-none"
            onSelect={onRemove}
          >
            <Trash2 size={14} />
            Remove Member
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
