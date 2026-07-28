import { apiClient } from './axios';
import type { MeetingSummarizeRequest, MeetingSummary } from '@/types/meeting.types';

export const meetingService = {
  /**
   * Submits a meeting transcript to the AI summarization agent.
   * @param payload Transcript text and optional language hint
   * @returns Structured meeting summary with decisions and action items
   */
  summarize: async (payload: MeetingSummarizeRequest): Promise<MeetingSummary> => {
    const response = await apiClient.post<MeetingSummary>('/meeting/summarize', payload);
    return response.data;
  },
};
