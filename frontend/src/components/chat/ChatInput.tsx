import { useState, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
}

const MAX_CHAR_LIMIT = 4000;

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    onSendMessage(query);
    setQuery('');

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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-bar">
          <button
            type="button"
            className="chat-input-action-btn"
            aria-label="Attach file"
            title="Attach file"
            tabIndex={-1}
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="chat-textarea"
            aria-label="Ask AI Assistant query input"
          />

          <div className="chat-input-actions">
            <button
              type="button"
              className="chat-input-action-btn"
              aria-label="Voice input"
              title="Voice input"
              tabIndex={-1}
            >
              <Mic size={18} />
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!query.trim() || isLoading}
              isLoading={isLoading}
              className="send-message-btn"
              aria-label="Send message"
            >
              {!isLoading && <Send size={16} />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
