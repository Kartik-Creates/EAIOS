import { useRef, useEffect, useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Expand, Paperclip, FileText, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { modalContentVariants, staggerContainer, staggerItem } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ROUTES } from '@/constants/routes';
import './FloatingChatAssistant.css';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
].join(',');

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FloatingChatAssistant = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isLoading]);

  if (location.pathname === '/chat') {
    return null;
  }

  const userName = user?.full_name || user?.email || 'You';

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedFile) || isLoading) return;
    const message = attachedFile
      ? `${trimmed}\n\n[Attached: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)]`
      : trimmed;
    sendMessage(message);
    setInput('');
    setAttachedFile(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAttachedFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="floating-chat-panel"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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

            <div className="floating-chat-input-area">
              {attachedFile && (
                <div className="floating-chat-attachment">
                  <div className="floating-chat-attachment-info">
                    <FileText size={14} className="floating-chat-attachment-icon" />
                    <span className="floating-chat-attachment-name">{attachedFile.name}</span>
                    <span className="floating-chat-attachment-size">{formatFileSize(attachedFile.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="floating-chat-attachment-remove"
                    onClick={handleRemoveFile}
                    aria-label="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="floating-chat-input-bar">
                <button
                  type="button"
                  className="floating-chat-attach-btn"
                  onClick={handleAttachClick}
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </button>
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
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </motion.button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatAssistant;
