'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface AdminApprovalRecord {
  id: number;
  approval_id: string;
  approval_type: 'kyc' | 'draw_integrity';
  subject_type: string;
  subject_id: string;
  status: 'valid' | 'rejected' | 'revoked' | 'superseded';
  source: string;
  approved_by: number;
  revocation_reason?: string | null;
  created_at: string;
}

export interface IssueKycPayload {
  subject_user_id: number;
  status: 'valid' | 'rejected';
  notes?: string;
}

export interface IssueDrawIntegrityPayload {
  draw_id: number;
  status: 'valid' | 'rejected';
  notes?: string;
}

export interface RevokeApprovalPayload {
  approval_id: string;
  reason: string;
}

export function useAdminApprovals(type?: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery<{ items: AdminApprovalRecord[] }, ApiError>({
    queryKey: ['admin', 'approvals', type],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type && type !== 'all') {
        params.append('type', type);
      }
      return apiClient<{ items: AdminApprovalRecord[] }>(`/admin/approvals?${params.toString()}`);
    },
    enabled,
    staleTime: 15 * 1000,
  });

  const issueKycMutation = useMutation<AdminApprovalRecord, ApiError, IssueKycPayload>({
    mutationFn: (payload) =>
      apiClient<AdminApprovalRecord>('/admin/approvals/kyc', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'coprizes'] });
    },
  });

  const issueDrawIntegrityMutation = useMutation<AdminApprovalRecord, ApiError, IssueDrawIntegrityPayload>({
    mutationFn: (payload) =>
      apiClient<AdminApprovalRecord>('/admin/approvals/draw-integrity', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'coprizes'] });
    },
  });

  const revokeMutation = useMutation<AdminApprovalRecord, ApiError, RevokeApprovalPayload>({
    mutationFn: ({ approval_id, reason }) =>
      apiClient<AdminApprovalRecord>(`/admin/approvals/${approval_id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'coprizes'] });
    },
  });

  return {
    approvals: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    issueKyc: issueKycMutation.mutateAsync,
    isIssuingKyc: issueKycMutation.isPending,
    issueDrawIntegrity: issueDrawIntegrityMutation.mutateAsync,
    isIssuingDrawIntegrity: issueDrawIntegrityMutation.isPending,
    revokeApproval: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  };
}
