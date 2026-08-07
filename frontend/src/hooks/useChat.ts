import { useContext } from 'react';
import { ChatContext, type ChatContextType } from '@/context/ChatContext';

/**
 * Custom hook to consume the global ChatContext.
 * Ensures it is used within a ChatProvider.
 */
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
