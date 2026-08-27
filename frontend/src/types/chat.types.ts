/**
 * chat.types.ts
 *
 * TypeScript contracts that mirror the backend Pydantic schemas in:
 *   backend/app/schemas/chat.py
 *
 * Also includes frontend-only types for managing chat UI state.
 *
 * RULE: Backend shapes (ChatRequest, Citation, ChatResponse) must
 *       never diverge from the actual backend schema without approval.
 */

// ─────────────────────────────────────────────
// Chat Request
// Mirrors: schemas/chat.py → ChatRequest
// Used by: POST /api/v1/chat (JSON body)
// Constraints: query min_length=1, max_length=4000
// ─────────────────────────────────────────────
export interface ChatRequest {
  query: string;
  conversation_id?: string; // omit on first message; reuse from response thereafter
}

// ─────────────────────────────────────────────
// Citation
// Mirrors: schemas/chat.py → Citation
// Part of: ChatResponse.citations[]
// ─────────────────────────────────────────────
export interface Citation {
  document_title: string;
  document_id: string;
  excerpt: string;
}

// ─────────────────────────────────────────────
// Chat Response
// Mirrors: schemas/chat.py → ChatResponse
// Returned by: POST /api/v1/chat
// ─────────────────────────────────────────────
export interface ChatResponse {
  answer: string;
  confidence: number;       // 0.0 – 1.0 float
  citations: Citation[];
  conversation_id: string;
  flagged_for_review: boolean;
  source?: string;          // "documents" | "gmail" | "jira" | "github" | "calendar" | "none"
}

// ─────────────────────────────────────────────
// Message Role (frontend-only)
// Distinguishes user-sent messages from AI responses in the chat UI
// ─────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant';

// ─────────────────────────────────────────────
// Message (frontend-only UI model)
// Represents a single entry in the chat history rendered in ChatWindow.
// Not sent to the backend — used only for local state in useChat hook.
// ─────────────────────────────────────────────
export interface Message {
  id: string;                    // locally generated uuid for React key
  role: MessageRole;
  content: string;               // user query text OR AI answer text
  timestamp: Date;
  // AI-only fields (undefined for user messages)
  confidence?: number;
  citations?: Citation[];
  flagged_for_review?: boolean;
  source?: string;               // "documents" | "gmail" | "jira" | "github" | "calendar" | "none"
  isError?: boolean;             // true when the API call failed
}

// ─────────────────────────────────────────────
// Chat Hook State (frontend-only)
// Defines the shape returned by useChat()
// ─────────────────────────────────────────────
export interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
}
