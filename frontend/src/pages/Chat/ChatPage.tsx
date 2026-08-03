import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './ChatPage.css';

export const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { messages, isLoading, sendMessage } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptProcessedRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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
              <h2 className="chat-empty-title">How can I help you today?</h2>
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
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatPage;
