import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Expand } from 'lucide-react';
import { cn } from '@/utils/cn';
import { modalContentVariants, staggerContainer, staggerItem } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ROUTES } from '@/constants/routes';
import './FloatingChatAssistant.css';

/**
 * Floating quick-access chat widget, rendered on every page except /chat
 * itself (see DashboardLayout / ROUTES.CHAT check below) — it shares the
 * exact same conversation (via ChatContext/useChat) as the full ChatPage,
 * so a message sent from either surface continues one real conversation
 * against the real backend, not a separate fake one.
 */
export const FloatingChatAssistant = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isLoading]);

  // Hidden entirely on the real Chat page — that page already has the full
  // conversation UI; showing a second copy of the same conversation there
  // would just be redundant.
  if (location.pathname === '/chat') {
    return null;
  }

  const userName = user?.full_name || user?.email || 'You';

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        type="button"
        className={cn('floating-chat-toggle', isOpen && 'floating-chat-toggle-open')}
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <Sparkles size={22} /> : <Sparkles size={22} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="floating-chat-panel"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="floating-chat-header">
              <div className="floating-chat-header-info">
                <div className="floating-chat-avatar">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="floating-chat-title">UnifyAI</h3>
                </div>
              </div>
              <motion.button
                type="button"
                className="floating-chat-close"
                onClick={() => navigate(ROUTES.CHAT)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open Chat"
                title="Open Chat"
              >
                <Expand size={18} />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="floating-chat-messages">
              {messages.length === 0 && !isLoading && (
                <div className="floating-chat-empty">
                  <p>Hi! Ask me anything about your company knowledge base.</p>
                </div>
              )}

              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {messages.map((msg) => (
                  <motion.div key={msg.id} variants={staggerItem} className="floating-chat-message-wrapper">
                    <ChatMessage message={msg} userName={userName} />
                  </motion.div>
                ))}
              </motion.div>

              {isLoading && (
                <div className="floating-chat-message floating-chat-message-assistant">
                  <div className="floating-chat-bubble">
                    <div className="floating-chat-typing">
                      <span className="floating-chat-typing-dot" />
                      <span className="floating-chat-typing-dot" />
                      <span className="floating-chat-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="floating-chat-input-area">
              <div className="floating-chat-input-bar">
                <textarea
                  className="floating-chat-textarea"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isLoading}
                  aria-label="Chat message input"
                />
                <motion.button
                  type="button"
                  className="floating-chat-send"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};