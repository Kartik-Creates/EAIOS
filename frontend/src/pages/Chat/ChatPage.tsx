import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import SplitText from '@/components/ui/SplitText';
import './ChatPage.css';

export const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { messages, isLoading, sendMessage } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptProcessedRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0) {
      setHasInteracted(true);
    }
  }, [messages.length]);

  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl && !promptProcessedRef.current) {
      promptProcessedRef.current = true;
      setHasInteracted(true);
      sendMessage(promptFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, sendMessage, setSearchParams]);

  const userName = user?.full_name || user?.email || 'You';

  return (
    <div className={`chat-page ${hasInteracted ? 'chat-has-interacted' : ''}`}>
      <main className="chat-messages-container" aria-label="Conversation thread">
        {messages.length === 0 && !isLoading && (
          <div className="chat-empty-state">
            <SplitText
              text="How can I help you today?"
              className="chat-empty-title"
              delay={50}
              duration={1.25}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              tag="h2"
            />
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} userName={userName} />
        ))}

        {isLoading && (
          <div className="chat-message-row assistant-row message-enter">
            <div className="assistant-avatar-icon">
              <Sparkles size={18} />
            </div>
            <div className="message-bubble-wrapper">
               <span className="sender-name text-xs text-slate-400">UNIFY-AI Assistant</span>
              <div className="message-bubble assistant-row">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className="chat-input-wrapper">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatPage;
