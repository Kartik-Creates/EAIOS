import { apiClient } from './axios';

export interface BriefingItem {
  source: string;
  title: string;
  detail: string;
  priority_hint: string;
  url?: string;
}

export interface SourceStatus {
  source: string;
  connected: boolean;
  item_count: number;
  error?: string;
}

export interface BriefingResponse {
  summary: string;
  sources: SourceStatus[];
  items: BriefingItem[];
}

export interface ActivityItem {
  id: string;
  type: 'github' | 'slack' | 'drive' | 'jira' | 'meeting' | 'workflow';
  title: string;
  description: string;
  timestamp: string;
}

export interface PendingApprovalItem {
  id: string;
  title: string;
  requester: string;
  type: string;
  submittedAt: string;
  workflow_id?: string;
}

export const dashboardService = {
  fetchBriefing: async (): Promise<BriefingResponse> => {
    const response = await apiClient.post<BriefingResponse>('/briefing');
    return response.data;
  },

  fetchActivity: async (): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ActivityItem[]>('/dashboard/activity');
    return response.data;
  },

  fetchPendingApprovals: async (): Promise<PendingApprovalItem[]> => {
    const response = await apiClient.get<PendingApprovalItem[]>('/dashboard/pending-approvals');
    return response.data;
  },

  approveRequest: async (requestId: string, comments?: string): Promise<void> => {
    // If id starts with req_, call workflows approval endpoint
    const cleanId = requestId.startsWith('wf-') ? requestId.replace('wf-', '') : requestId;
    await apiClient.post(`/workflows/approvals/${cleanId}/approve`, { comments });
  },
};
