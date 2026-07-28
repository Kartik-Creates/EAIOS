import { useState, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { Send, Trash2, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  hasMessages: boolean;
}

const MAX_CHAR_LIMIT = 4000;

export const ChatInput = ({
  onSendMessage,
  onClearChat,
  isLoading,
  hasMessages,
}: ChatInputProps) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    onSendMessage(query);
    setQuery('');

    // Reset height of textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHAR_LIMIT) {
      setQuery(val);
    }

    // Auto-expand textarea height up to a max limit
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about internal documents, APIs, or company guidelines (Press Enter to send)..."
            disabled={isLoading}
            className="chat-textarea"
            aria-label="Ask AI Assistant query input"
          />

          <div className="chat-input-controls">
            <span className="char-count">
              {query.length} / {MAX_CHAR_LIMIT}
            </span>

            {hasMessages && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearChat}
                disabled={isLoading}
                title="Clear current conversation"
                className="clear-chat-btn"
              >
                <Trash2 size={16} />
                <span className="clear-label">Reset Chat</span>
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!query.trim() || isLoading}
              isLoading={isLoading}
              className="send-message-btn"
            >
              <span>Send</span>
              {!isLoading && <Send size={16} className="ml-1" />}
            </Button>
          </div>
        </div>
      </form>
      <div className="chat-input-hint">
        <span>
          <CornerDownLeft size={12} className="inline mr-1" />
          ProTip: Use <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for line breaks. RAG
          searches are scoped to your RBAC permissions.
        </span>
      </div>
    </div>
  );
};
