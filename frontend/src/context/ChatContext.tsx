/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useEffect, createContext, type Context, type ReactNode } from 'react';
import type { ChatState, Message } from '@/types/chat.types';
import { chatService } from '@/services/chatService';

const STORAGE_KEY = 'eaios_recent_chats';

export interface ChatSession {
  id: string;
  title: string;
  time: string;
  messages: Message[];
  conversationId: string | null;
}

export interface ChatContextType extends ChatState {
  sendMessage: (queryText: string) => Promise<void>;
  clearChat: () => void;
  newChat: () => void;
  currentChatId: string | null;
  chatSessions: ChatSession[];
  switchChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
}

export const ChatContext: Context<ChatContextType | undefined> =
  createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    conversationId: null,
    isLoading: false,
    error: null,
  });
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions));
  }, [chatSessions]);

  // Synchronize active chat to chatSessions whenever messages or conversationId change
  useEffect(() => {
    if (!currentChatId || state.messages.length === 0) return;

    setChatSessions((prev) => {
      const existingIdx = prev.findIndex(s => s.id === currentChatId);
      
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.messages.length === state.messages.length && existing.conversationId === state.conversationId) {
          return prev;
        }
        
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          messages: state.messages,
          conversationId: state.conversationId
        };
        return updated;
      } else {
        // Create new session
        const firstUserMsg = state.messages.find(m => m.role === 'user');
        const title = firstUserMsg ? (firstUserMsg.content.length > 35 ? firstUserMsg.content.slice(0, 35) + '...' : firstUserMsg.content) : 'New Chat';
        
        const newSession: ChatSession = {
          id: currentChatId,
          title,
          time: 'Just now',
          messages: state.messages,
          conversationId: state.conversationId
        };
        
        // Add at the beginning
        return [newSession, ...prev];
      }
    });
  }, [state.messages, state.conversationId, currentChatId]);

  const sendMessage = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || state.isLoading) return;

      const isNewChat = !currentChatId;
      const activeChatId = isNewChat ? `chat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` : currentChatId;

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

      if (isNewChat) {
        setCurrentChatId(activeChatId);
      }

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
      } catch (err: unknown) {
        const e = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
        const errorMessageText =
          e?.response?.status === 429
            ? 'Rate limit exceeded (10 queries/min limit). Please wait a moment before sending another query.'
            : e?.response?.data?.detail || e?.message || 'Failed to communicate with AI Assistant.';

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
    [state.isLoading, state.conversationId, currentChatId]
  );

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      conversationId: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const newChat = useCallback(() => {
    setState({
      messages: [],
      conversationId: null,
      isLoading: false,
      error: null,
    });
    setCurrentChatId(null);
  }, []);

  const switchChat = useCallback((chatId: string) => {
    setChatSessions((prev) => {
      const session = prev.find((s) => s.id === chatId);
      if (session) {
        setCurrentChatId(session.id);
        setState({
          messages: session.messages,
          conversationId: session.conversationId,
          isLoading: false,
          error: null,
        });
      }
      return prev;
    });
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== chatId));
    setCurrentChatId((prevCurrent) => {
      if (prevCurrent === chatId) {
        setState({
          messages: [],
          conversationId: null,
          isLoading: false,
          error: null,
        });
        return null;
      }
      return prevCurrent;
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
        newChat,
        currentChatId,
        chatSessions,
        switchChat,
        deleteChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;