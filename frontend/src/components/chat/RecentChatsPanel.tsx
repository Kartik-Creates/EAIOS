import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import type { Message } from '@/types/chat.types';
import './RecentChatsPanel.css';

const STORAGE_KEY = 'eaios_recent_chats';

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
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prevUserMsgCount = useRef(0);

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

  const handleChatClick = (title: string) => {
    navigate(`${ROUTES.CHAT}?prompt=${encodeURIComponent(title)}`);
    setIsOpen(false);
  };

  const handleDelete = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = chats.filter((c) => c.id !== chatId);
    setChats(updated);
    saveChats(updated);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasConversations = chats.length > 0;

  if (!hasConversations) return null;

  return (
    <div className="recent-chats-panel" ref={panelRef}>
      <motion.button
        type="button"
        className={cn('recent-chats-handle', isOpen && 'recent-chats-handle-open')}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Recent Chats"
        aria-expanded={isOpen}
      >
        {chats.map((_, index) => (
          <span key={index} className="handle-line" />
        ))}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="recent-chats-floating-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="recent-chats-panel-header">
              <h3 className="recent-chats-panel-title">Recent Chats</h3>
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
                  <div className="recent-chat-item-meta">
                    <Clock size={12} />
                    <span>{chat.time}</span>
                  </div>
                  <button
                    type="button"
                    className="recent-chat-item-delete"
                    onClick={(e) => handleDelete(chat.id, e)}
                    aria-label={`Delete ${chat.title}`}
                  >
                    <Trash2 size={12} />
                  </button>
                  <ChevronRight size={14} className="recent-chat-item-arrow" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecentChatsPanel;