import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Sparkles, PlusCircle, ShieldCheck, FileText, HardDrive, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import './ChatPage.css';

export const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { messages, conversationId, isLoading, sendMessage, clearChat } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptProcessedRef = useRef(false);

  // Auto-scroll to bottom of conversation on new messages or loading state
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check if a prompt was passed via URL search parameters e.g. /chat?prompt=...
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl && !promptProcessedRef.current) {
      promptProcessedRef.current = true;
      sendMessage(promptFromUrl);
      // Clean up URL parameter so refresh doesn't resend
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, sendMessage, setSearchParams]);

  const userName = user?.full_name || user?.email || 'You';

  return (
    <div className="chat-page">
      {/* ── Chat Header Bar ── */}
      <header className="chat-page-header">
        <div className="chat-header-title">
          <div className="assistant-avatar-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>Enterprise AI Assistant</h1>
            <p className="text-xs text-slate-400">RAG Neural Retrieval Engine — Active</p>
          </div>
        </div>

        <div className="chat-header-meta">
          {conversationId && (
            <span className="conversation-tag">
              ID: {conversationId.slice(0, 8)}...
            </span>
          )}
          <Badge variant="purple">FastAPI RAG</Badge>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              disabled={isLoading}
              title="Start a fresh conversation"
            >
              <PlusCircle size={16} className="mr-1" />
              New Chat
            </Button>
          )}
        </div>
      </header>

      {/* ── Messages Container ── */}
      <main className="chat-messages-container" aria-label="Conversation thread">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-state-icon">
              <MessageSquare size={32} />
            </div>

            <div className="empty-state-text">
              <h2>How can I assist your enterprise today?</h2>
              <p>
                Query company policies, codebases, Google Drive documents, or security guidelines
                with cited source excerpts.
              </p>
            </div>

            <div className="starter-prompts-grid">
              <div
                className="starter-prompt-card"
                onClick={() => sendMessage('Summarize our company data retention and security compliance policies')}
              >
                <div className="starter-prompt-title">
                  <ShieldCheck size={16} className="text-blue-400" />
                  Security Compliance
                </div>
                <div className="starter-prompt-desc">
                  Summarize data retention & security standards from company handbook
                </div>
              </div>

              <div
                className="starter-prompt-card"
                onClick={() => sendMessage('How do I configure OAuth2 integration for Google Drive in EAIOS?')}
              >
                <div className="starter-prompt-title">
                  <HardDrive size={16} className="text-purple-400" />
                  Drive Integration
                </div>
                <div className="starter-prompt-desc">
                  Step-by-step setup guide for continuous Google Drive syncing
                </div>
              </div>

              <div
                className="starter-prompt-card"
                onClick={() => sendMessage('What are the rate limiting rules and endpoints available in EAIOS?')}
              >
                <div className="starter-prompt-title">
                  <FileText size={16} className="text-green-400" />
                  API Documentation
                </div>
                <div className="starter-prompt-desc">
                  Check rate limits (10/min chat, 30/min search) and endpoint definitions
                </div>
              </div>

              <div
                className="starter-prompt-card"
                onClick={() => sendMessage('Explain RBAC roles and permissions (Admin, Manager, Employee, HR)')}
              >
                <div className="starter-prompt-title">
                  <Users size={16} className="text-amber-400" />
                  RBAC Hierarchy
                </div>
                <div className="starter-prompt-desc">
                  Overview of access control matrix and permission bounds
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} userName={userName} />
          ))
        )}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="chat-message-row assistant-row">
            <div className="assistant-avatar-icon">
              <Sparkles size={18} />
            </div>
            <div className="message-bubble-wrapper">
              <span className="sender-name text-xs text-slate-400">EAIOS Assistant</span>
              <div className="message-bubble assistant-row">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="text-xs text-slate-400 ml-2">Retrieving embeddings & generating answer...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ── Floating / Sticky Input Bar ── */}
      <ChatInput
        onSendMessage={sendMessage}
        onClearChat={clearChat}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
      />
    </div>
  );
};

export default ChatPage;
