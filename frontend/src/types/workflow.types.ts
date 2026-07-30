/**
 * workflow.types.ts
 *
 * TypeScript contracts for the Workflow Automation module.
 *
 * Mirrors expected backend schemas in:
 *   backend/app/schemas/workflow.py
 *
 * Workflow tools are a fixed menu of named functions with strict schemas.
 * Write actions require human confirmation before execution.
 */

// ─────────────────────────────────────────────
// Workflow Tool Definition
// Returned by: GET /api/v1/workflow/tools
// ─────────────────────────────────────────────
export interface WorkflowTool {
  name: string;
  description: string;
  requires_confirmation: boolean;
  parameters: WorkflowParameter[];
}

export interface WorkflowParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label: string;
  description: string;
  required: boolean;
  default?: string | number | boolean;
}

// ─────────────────────────────────────────────
// Workflow Execution Request
// Used by: POST /api/v1/workflow/execute
// ─────────────────────────────────────────────
export interface WorkflowExecuteRequest {
  tool_name: string;
  parameters: Record<string, any>;
  confirmed?: boolean;
}

// ─────────────────────────────────────────────
// Workflow Run
// Returned by: POST /api/v1/workflow/execute
// ─────────────────────────────────────────────
export type WorkflowRunStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowRun {
  id: string;
  tool_name: string;
  status: WorkflowRunStatus;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  requires_confirmation: boolean;
  confirmation_prompt?: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Workflow Hook State (frontend-only)
// ─────────────────────────────────────────────
export interface WorkflowState {
  tools: WorkflowTool[];
  selectedTool: WorkflowTool | null;
  formValues: Record<string, any>;
  runs: WorkflowRun[];
  activeRun: WorkflowRun | null;
  isLoadingTools: boolean;
  isExecuting: boolean;
  error: string | null;
}
