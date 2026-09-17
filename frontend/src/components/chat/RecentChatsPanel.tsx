import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, ChevronDown, Plus } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import './RecentChatsPanel.css';

const AUTO_COLLAPSE_DELAY = 3000;

export const RecentChatsPanel = () => {
  const { chatSessions, newChat, switchChat, deleteChat, currentChatId } = useChat();
  const [isOpen, setIsOpen] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-collapse timer: starts on mount, clears on unmount
  useEffect(() => {
    if (hasUserInteracted) return;

    autoCollapseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, AUTO_COLLAPSE_DELAY);

    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
    };
  }, [hasUserInteracted]);

  // Outside click: collapse when clicking outside the panel (only when open)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setHasUserInteracted(true);
    setIsOpen((prev) => !prev);
  }, []);

  const handleOpen = useCallback(() => {
    setHasUserInteracted(true);
    setIsOpen(true);
  }, []);

  const handleChatClick = (chatId: string) => {
    switchChat(chatId);
    if (window.innerWidth <= 768) setIsOpen(false); // friendly for mobile
  };

  const handleDelete = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteChat(chatId);
  };

  const handleNewChat = () => {
    newChat();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={panelRef}
          className="recent-chats-panel"
          initial={{ opacity: 0, scale: 0.85, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.85, x: -20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="recent-chats-panel-header">
            <h3 className="recent-chats-panel-title">Recent Chats</h3>
            <button
              type="button"
              className="recent-chats-collapse-btn"
              onClick={handleToggle}
              aria-label="Collapse recent chats"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="recent-chats-list">
            <button
              type="button"
              className="recent-chat-item"
              onClick={handleNewChat}
            >
              <div className="recent-chat-item-icon">
                <Plus size={16} />
              </div>
              <div className="recent-chat-item-content">
                <div className="recent-chat-item-title">New Chat</div>
              </div>
            </button>

            {chatSessions.length > 0 && <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 'var(--space-1) 0' }} />}

            {chatSessions.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`recent-chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => handleChatClick(chat.id)}
              >
                <div className="recent-chat-item-icon">
                  <MessageSquare size={16} />
                </div>
                <div className="recent-chat-item-content">
                  <div className="recent-chat-item-title">{chat.title}</div>
                </div>

                <button
                  type="button"
                  className="recent-chat-item-delete"
                  onClick={(e) => handleDelete(chat.id, e)}
                  aria-label={`Delete ${chat.title}`}
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.button
          type="button"
          className="recent-chats-float-btn"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleOpen}
          aria-label="Open recent chats"
          title="Recent Chats"
        >
          <MessageSquare size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default RecentChatsPanel;