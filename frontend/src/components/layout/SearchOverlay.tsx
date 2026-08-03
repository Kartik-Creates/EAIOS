import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, FileText, Sparkles, Shield, Plug } from 'lucide-react';
import { SEARCH_ALL_MOCKS } from '@/constants/searchMocks';
import { modalOverlayVariants, modalContentVariants, staggerContainer, staggerItem } from '@/lib/motion';

const MOCK_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare size={18} className="text-muted" />,
  doc: <FileText size={18} className="text-muted" />,
  meeting: <Shield size={18} className="text-muted" />,
  workflow: <Sparkles size={18} className="text-muted" />,
  integration: <Plug size={18} className="text-muted" />,
  policy: <Shield size={18} className="text-muted" />,
};

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length > 0
    ? SEARCH_ALL_MOCKS.filter((item) => {
        const hay = [item.title, item.description, item.icon].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
    : [];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="search-overlay-backdrop"
          variants={modalOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="search-overlay-panel"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div className="search-overlay-header">
              <div className="search-overlay-input-wrapper">
                <Search size={18} className="search-overlay-icon" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  className="search-overlay-input"
                  placeholder="Search documents, chats, integrations..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search"
                />
                <AnimatePresence>
                  {query && (
                    <motion.button
                      key="clear"
                      type="button"
                      className="search-overlay-clear"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                type="button"
                className="search-overlay-close"
                onClick={onClose}
                aria-label="Close search"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <X size={18} aria-hidden="true" />
                <span>Close</span>
              </motion.button>
            </div>

            <motion.div
              className="search-overlay-body"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {query.trim().length > 0 ? (
                results.length > 0 ? (
                  <motion.div className="search-overlay-results" initial="hidden" animate="visible" variants={staggerContainer}>
                    {results.map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        className="search-overlay-result-item"
                        onClick={onClose}
                        variants={staggerItem}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="search-overlay-result-icon">
                          {MOCK_ICONS[item.icon || 'doc']}
                        </span>
                        <span className="search-overlay-result-title">{item.title}</span>
                        {item.timestamp && (
                          <span className="search-overlay-result-time">{item.timestamp}</span>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div className="search-overlay-empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Search size={32} className="search-overlay-empty-icon" />
                    <p>No results found</p>
                  </motion.div>
                )
              ) : (
                <motion.div className="search-overlay-recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <h3 className="search-overlay-recent-title">Recent Chats</h3>
                  <motion.div className="search-overlay-results" initial="hidden" animate="visible" variants={staggerContainer}>
                    {SEARCH_ALL_MOCKS.slice(0, 5).map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        className="search-overlay-result-item"
                        onClick={() => setQuery(item.title)}
                        variants={staggerItem}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="search-overlay-result-icon">
                          {MOCK_ICONS[item.icon || 'chat']}
                        </span>
                        <span className="search-overlay-result-title">{item.title}</span>
                        {item.timestamp && (
                          <span className="search-overlay-result-time">{item.timestamp}</span>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
