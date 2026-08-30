import { useState, useRef, type KeyboardEvent, type FormEvent, ChangeEvent } from 'react';
import { Send, Paperclip, Mic, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (query: string, file?: File | null) => void;
  isLoading: boolean;
}

const MAX_CHAR_LIMIT = 4000;

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

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [query, setQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if ((!query.trim() && !attachedFile) || isLoading) return;

    onSendMessage(query, attachedFile);
    setQuery('');
    setAttachedFile(null);

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
    <div className="chat-input-container">
      {attachedFile && (
        <div className="chat-attachment-preview">
          <div className="chat-attachment-info">
            <FileText size={16} className="chat-attachment-icon" />
            <span className="chat-attachment-name">{attachedFile.name}</span>
            <span className="chat-attachment-size">{formatFileSize(attachedFile.size)}</span>
          </div>
          <button
            type="button"
            className="chat-attachment-remove"
            onClick={handleRemoveFile}
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-bar">
          <button
            type="button"
            className="chat-input-action-btn"
            onClick={handleAttachClick}
            aria-label="Attach file"
            title="Attach file"
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
              disabled={(!query.trim() && !attachedFile) || isLoading}
              isLoading={isLoading}
              className="send-message-btn"
              aria-label="Send message"
            >
              {!isLoading && <Send size={16} />}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </form>
    </div>
  );
};

export default ChatInput;
