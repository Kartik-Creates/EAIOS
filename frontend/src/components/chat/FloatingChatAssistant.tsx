import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { modalContentVariants, staggerContainer, staggerItem } from '@/lib/motion';
import './FloatingChatAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate assistant response for demo purposes
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: "Thanks for your message! I'm here to help with anything you need.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        {isOpen ? <X size={22} /> : <Sparkles size={22} />}
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
                  <span className="floating-chat-subtitle">Online</span>
                </div>
              </div>
              <motion.button
                type="button"
                className="floating-chat-close"
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close chat"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="floating-chat-messages">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    variants={staggerItem}
                    className={cn(
                      'floating-chat-message',
                      msg.role === 'user' ? 'floating-chat-message-user' : 'floating-chat-message-assistant'
                    )}
                  >
                    <div className="floating-chat-bubble">
                      <p className="floating-chat-bubble-text">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {isTyping && (
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
                  aria-label="Chat message input"
                />
                <motion.button
                  type="button"
                  className="floating-chat-send"
                  onClick={handleSend}
                  disabled={!input.trim()}
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
