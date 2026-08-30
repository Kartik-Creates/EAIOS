import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { RecentChatsPanel } from '@/components/chat/RecentChatsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { getRandomWelcomeMessage } from '@/utils/welcomeMessages';
import './ChatPage.css';

export const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // conversation state (messages/isLoading/sendMessage) is shared globally via
  // ChatContext — the same conversation continues here regardless of whether
  // it was started on this page or via FloatingChatAssistant elsewhere.
  const { messages, isLoading, sendMessage } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptProcessedRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [welcomeMessage] = useState(() => getRandomWelcomeMessage());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0) {
      setHasInteracted(true);
    }
  }, [messages.length]);

  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl && !promptProcessedRef.current) {
      promptProcessedRef.current = true;
      setHasInteracted(true);
      sendMessage(promptFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, sendMessage, setSearchParams]);

  const userName = user?.full_name || user?.email || 'You';

  return (
    <div className={`chat-page ${hasInteracted ? 'chat-has-interacted' : ''}`}>
      <main className="chat-messages-container" aria-label="Conversation thread">
        <motion.div variants={staggerContainer}>
          {messages.length === 0 && !isLoading && (
            <motion.div className="chat-empty-state" variants={staggerItem}>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={welcomeMessage}
                  className="chat-empty-title"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {welcomeMessage}
                </motion.h2>
              </AnimatePresence>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div key={msg.id} variants={staggerItem}>
              <ChatMessage message={msg} userName={userName} />
            </motion.div>
          ))}

          {isLoading && (
            <motion.div className="chat-message-row assistant-row" variants={staggerItem}>
              <div className="assistant-avatar-icon">
                <Sparkles size={18} />
              </div>
              <div className="message-bubble-wrapper">
                <span className="sender-name text-xs text-slate-400">UnifyAI Assistant</span>
                <div className="message-bubble assistant-row">
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div ref={messagesEndRef} />
      </main>

      <div className="chat-input-wrapper">
        <ChatInput
          onSendMessage={(query, file) => {
            const message = file
              ? `${query}\n\n[Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`
              : query;
            sendMessage(message);
          }}
          isLoading={isLoading}
        />
      </div>

      <RecentChatsPanel messages={messages} />
    </div>
  );
};

export default ChatPage;
