import { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, FileText, Sparkles, Shield, Plug } from 'lucide-react';
import { SEARCH_ALL_MOCKS } from '@/constants/searchMocks';

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

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-overlay-panel" role="dialog" aria-modal="true" aria-label="Search">
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
            {query && (
              <button
                type="button"
                className="search-overlay-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="button" className="search-overlay-close" onClick={onClose} aria-label="Close search">
            <X size={18} aria-hidden="true" />
            <span>Close</span>
          </button>
        </div>

        <div className="search-overlay-body">
          {query.trim().length > 0 ? (
            results.length > 0 ? (
              <div className="search-overlay-results">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="search-overlay-result-item"
                    onClick={onClose}
                  >
                    <span className="search-overlay-result-icon">
                      {MOCK_ICONS[item.icon || 'doc']}
                    </span>
                    <span className="search-overlay-result-title">{item.title}</span>
                    {item.timestamp && (
                      <span className="search-overlay-result-time">{item.timestamp}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="search-overlay-empty">
                <Search size={32} className="search-overlay-empty-icon" />
                <p>No results found</p>
              </div>
            )
          ) : (
            <div className="search-overlay-recent">
              <h3 className="search-overlay-recent-title">Recent Chats</h3>
              <div className="search-overlay-results">
                {SEARCH_ALL_MOCKS.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="search-overlay-result-item"
                    onClick={() => setQuery(item.title)}
                  >
                    <span className="search-overlay-result-icon">
                      {MOCK_ICONS[item.icon || 'chat']}
                    </span>
                    <span className="search-overlay-result-title">{item.title}</span>
                    {item.timestamp && (
                      <span className="search-overlay-result-time">{item.timestamp}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
