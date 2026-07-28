/**
 * meeting.types.ts
 *
 * TypeScript contracts that mirror the expected backend Pydantic schemas in:
 *   backend/app/schemas/meeting.py
 *
 * Also includes frontend-only types for managing meeting summary UI state.
 *
 * RULE: Backend shapes (MeetingSummary, Decision, ActionItem) must
 *       never diverge from the actual backend schema without a matching backend change.
 */

export interface MeetingSummarizeRequest {
  transcript: string;
  language?: string;
}

export interface Decision {
  id: string;
  description: string;
  context?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  due_date?: string;
  completed: boolean;
}

export interface MeetingSummary {
  summary: string;
  decisions: Decision[];
  action_items: ActionItem[];
  confidence: number;
  duration_seconds?: number;
  participants_count?: number;
}

export interface MeetingErrorResponse {
  detail?: string;
}

export const MeetingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type MeetingStatus = typeof MeetingState[keyof typeof MeetingState];
