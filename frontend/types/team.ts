export type MemberRole = 'admin' | 'member'
export type MemberStatus = 'active' | 'pending'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: MemberRole
  status: 'active'
  createdAt: string
  avatarUrl?: string
}

export interface PendingInvitation {
  id: string
  email: string
  role: MemberRole
  status: 'pending'
  expiresAt: string
  createdAt: string
}

export interface TeamData {
  members: TeamMember[]
  pendingInvitations: PendingInvitation[]
  totalCount: number
}

export interface InvitationDetails {
  email: string
  role: MemberRole
  orgName: string
  inviterName: string
  expiresAt: string
}

export interface AcceptInvitationResponse {
  accessToken?: string
  refreshToken?: string
  isNewUser: boolean
  redirectTo: string
}
