/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { Message, ChatState } from '@/types/chat.types';
import { chatService } from '@/services/chatService';

export interface ChatContextType extends ChatState {
  sendMessage: (queryText: string) => Promise<void>;
  clearChat: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Single shared chat conversation for the whole app.
 *
 * ChatPage and FloatingChatAssistant both consume this same instance via
 * useChat() — sending a message from either surface continues the same
 * conversation_id and message history, rather than each holding its own
 * disconnected state.
 */
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    conversationId: null,
    isLoading: false,
    error: null,
  });

  const sendMessage = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || state.isLoading) return;

      const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const response = await chatService.sendMessage({
          query: trimmed,
          conversation_id: state.conversationId || undefined,
        });

        const aiMessageId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const aiMessage: Message = {
          id: aiMessageId,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          confidence: response.confidence,
          citations: response.citations,
          flagged_for_review: response.flagged_for_review,
          source: response.source,
        };

        setState((prev) => ({
          ...prev,
          conversationId: response.conversation_id,
          messages: [...prev.messages, aiMessage],
          isLoading: false,
        }));
      } catch (err: any) {
        const errorMessageText =
          err?.response?.status === 429
            ? 'Rate limit exceeded (10 queries/min limit). Please wait a moment before sending another query.'
            : err?.response?.data?.detail || err?.message || 'Failed to communicate with AI Assistant.';

        const errorMessage: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorMessageText,
          timestamp: new Date(),
          isError: true,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false,
          error: errorMessageText,
        }));
      }
    },
    [state.isLoading, state.conversationId]
  );

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      conversationId: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages: state.messages,
        conversationId: state.conversationId,
        isLoading: state.isLoading,
        error: state.error,
        sendMessage,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
