import { apiClient } from './axios';
import type { ChatRequest, ChatResponse } from '@/types/chat.types';

export const chatService = {
  /**
   * Submits a chat message to the RAG backend.
   * @param payload Query and optional conversation_id
   * @returns AI response with answers and citations
   */
  sendMessage: async (payload: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', payload);
    return response.data;
  }
};
