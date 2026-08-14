import { useState } from 'react';
import { User, Copy, Check, AlertTriangle, BookOpen } from 'lucide-react';
import type { Message } from '@/types/chat.types';
import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/Badge';
import { CitationCard } from './CitationCard';

const messageEnter = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

interface ChatMessageProps {
  message: Message;
  userName?: string;
}

export const ChatMessage = ({ message, userName = 'You' }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy message:', err);
    }
  };

  // Helper for confidence color and label
  const getConfidenceBadge = (confidence?: number) => {
    if (confidence === undefined) return null;
    const percentage = Math.round(confidence * 100);

    if (confidence >= 0.8) {
      return <Badge variant="green">{percentage}% High Confidence</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge variant="yellow">{percentage}% Moderate Match</Badge>;
    } else {
      return <Badge variant="red">{percentage}% Low Confidence</Badge>;
    }
  };

  const renderHeaderBadge = () => {
    if (isUser) return null;
    const src = message.source?.toLowerCase();
    if (src === 'gmail') return <Badge variant="red">Gmail</Badge>;
    if (src === 'jira') return <Badge variant="blue">Jira</Badge>;
    if (src === 'github') return <Badge variant="slate">GitHub</Badge>;
    if (src === 'calendar') return <Badge variant="green">Calendar</Badge>;
    if (src === 'none') return null;

    // Default to document confidence badge if available
    if (message.confidence !== undefined && message.confidence > 0) {
      return getConfidenceBadge(message.confidence);
    }
    return null;
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isDocSource = !message.source || message.source === 'documents';

  return (
    <motion.div
      className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}
      variants={messageEnter}
      initial="hidden"
      animate="visible"
    >
      <div className="message-avatar">
        {isUser ? (
          <div className="user-avatar-icon">
            <User size={18} />
          </div>
        ) : (
          <div className="assistant-avatar-icon">
            <img src="/logo-icon-dark-mode.png" alt="UnifyAI" style={{ width: 18, height: 18, objectFit: 'contain' }} />
          </div>

        )}
      </div>

      <div className="message-bubble-wrapper">
        <div className="message-header">
          <span className="sender-name">{isUser ? userName : 'UnifyAI Assistant'}</span>
          <span className="message-time">{formattedTime}</span>
          {!isUser && renderHeaderBadge()}
        </div>

        <div className={`message-bubble ${message.isError ? 'error-bubble' : ''}`}>
          <p className="message-text">{message.content}</p>

          {/* Flagged for Review Warning Banner */}
          {message.flagged_for_review && isDocSource && (
            <div className="flagged-banner">
              <AlertTriangle size={16} className="flagged-icon" />
              <span>
                No direct document match found. Query has been flagged for knowledge base review.
              </span>
            </div>
          )}
        </div>

        {/* AI Citations Drawer */}
        {!isUser && isDocSource && message.citations && message.citations.length > 0 && (
          <div className="citations-container">
            <button
              type="button"
              className="citations-toggle-btn"
              onClick={() => setShowCitations((prev) => !prev)}
            >
              <BookOpen size={14} />
              <span>
                {showCitations
                  ? `Hide ${message.citations.length} Source Citations`
                  : `View ${message.citations.length} Source Citations`}
              </span>
            </button>

            {showCitations && (
              <div className="citations-list">
                {message.citations.map((citation, idx) => (
                  <CitationCard key={`${citation.document_id}-${idx}`} citation={citation} index={idx} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Copy Action Button */}
        <div className="message-footer-actions">
          <button
            type="button"
            className="action-btn"
            onClick={handleCopy}
            title="Copy message to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
