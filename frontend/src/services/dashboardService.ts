import { apiClient } from './axios';

export interface BriefingItem {
  id?: string;
  source: string;
  title: string;
  detail: string;
  priority_hint: string;
  url?: string;
  sender_or_author?: string;
}

export interface BriefingItemDetail {
  id: string;
  source: string;
  title: string;
  detail: string;
  body: string;
  priority_hint: string;
  url?: string;
  sender_or_author?: string;
  created_or_due_date?: string;
  status?: string;
  metadata?: Record<string, any>;
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
  type: 'github' | 'slack' | 'drive' | 'jira' | 'meeting' | 'workflow' | 'chat';
  title: string;
  description: string;
  timestamp: string;
}

export const dashboardService = {
  fetchBriefing: async (): Promise<BriefingResponse> => {
    const response = await apiClient.post<BriefingResponse>('/briefing');
    return response.data;
  },

  fetchItemDetail: async (source: string, itemId: string): Promise<BriefingItemDetail> => {
    const response = await apiClient.get<BriefingItemDetail>(`/briefing/${source}/${itemId}`);
    return response.data;
  },

  fetchActivity: async (): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ActivityItem[]>('/dashboard/activity');
    return response.data;
  },
};
