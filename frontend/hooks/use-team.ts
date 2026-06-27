import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api-client'
import type {
  TeamData,
  MemberRole,
  InvitationDetails,
  AcceptInvitationResponse,
} from '@/types/team'

// Fetch all members and pending invitations
export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<TeamData>('/api/org/members'),
    staleTime: 1000 * 60 * 2,  // 2 minutes
  })
}

// Invite a new member
export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { email: string; role: MemberRole }) =>
      api.post('/api/org/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Remove a member
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/org/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Change a member's role
export function useChangeMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string
      role: MemberRole
    }) => api.patch(`/api/org/members/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Revoke a pending invitation
export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/api/org/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

// Get invitation details by token (no auth)
export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () =>
      api.get<InvitationDetails>(`/api/auth/invite/${token}`),
    enabled: !!token && token.length === 64,
    retry: false,  // Don't retry on 404/410
  })
}

// Accept invitation
export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (data: {
      token: string
      name: string
      password: string
    }) =>
      api.post<AcceptInvitationResponse>(
        '/api/auth/invite/accept',
        data,
      ),
  })
}
