import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, ChevronDown } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { Message } from '@/types/chat.types';
import './RecentChatsPanel.css';

const STORAGE_KEY = 'eaios_recent_chats';
const AUTO_COLLAPSE_DELAY = 3000;

interface ChatEntry {
  id: string;
  title: string;
  time: string;
}

const loadChats = (): ChatEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
};

const saveChats = (chats: ChatEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};

export const RecentChatsPanel = ({ messages }: { messages: Message[] }) => {
  const [chats, setChats] = useState<ChatEntry[]>(loadChats);
  const [isOpen, setIsOpen] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUserMsgCount = useRef(0);
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === 'user');
    const currentCount = userMessages.length;

    if (currentCount > prevUserMsgCount.current && currentCount > 0) {
      const latestMsg = userMessages[currentCount - 1];
      const title = latestMsg.content.length > 35
        ? latestMsg.content.slice(0, 35) + '...'
        : latestMsg.content;

      const newChat: ChatEntry = {
        id: latestMsg.id,
        title,
        time: 'Just now',
      };

      const updated = [newChat, ...chats.filter((c) => c.id !== latestMsg.id)];
      setChats(updated);
      saveChats(updated);
    }

    prevUserMsgCount.current = currentCount;
  }, [messages, chats]);

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

  const handleChatClick = (title: string) => {
    navigate(`${ROUTES.CHAT}?prompt=${encodeURIComponent(title)}`);
  };

  const handleDelete = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = chats.filter((c) => c.id !== chatId);
    setChats(updated);
    saveChats(updated);
  };

  const hasConversations = chats.length > 0;

  if (!hasConversations) return null;

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
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className="recent-chat-item"
                onClick={() => handleChatClick(chat.title)}
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