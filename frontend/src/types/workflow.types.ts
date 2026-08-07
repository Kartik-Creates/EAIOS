/**
 * workflow.types.ts
 *
 * Refactored TypeScript contracts for Workflow Foundation (Phases 1-5).
 * Mirrors backend models in:
 *   - backend/app/workflows/enums.py
 *   - backend/app/schemas/workflow.py
 *   - backend/app/workflows/plan.py
 *   - backend/app/workflows/approval_models.py
 *   - backend/app/workflows/step_result.py
 *   - backend/app/workflows/execution.py
 */

export type WorkflowCategory =
  | 'Reporting'
  | 'Communication'
  | 'Meetings'
  | 'Knowledge'
  | 'Engineering'
  | 'Project Management'
  | 'Automation'
  | 'Administration';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IntegrationType =
  | 'Slack'
  | 'GitHub'
  | 'Gmail'
  | 'Jira'
  | 'Google Drive'
  | 'Company Brain'
  | 'Meeting Intelligence';

export type CapabilityType =
  | 'READ_GMAIL'
  | 'SEND_GMAIL'
  | 'READ_SLACK'
  | 'POST_SLACK'
  | 'READ_JIRA'
  | 'CREATE_JIRA'
  | 'READ_GITHUB'
  | 'UPDATE_GITHUB'
  | 'SEARCH_COMPANY_BRAIN'
  | 'GENERATE_REPORT'
  | 'SUMMARIZE_MEETING'
  | 'SYNC_DRIVE';

export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'textarea';

export type WorkflowRunStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ApprovalLifecycleState =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  options?: string[];
}

export interface WorkflowParameter {
  id: string;
  label: string;
  description: string;
  type: ParameterType;
  required: boolean;
  placeholder?: string;
  default_value?: any;
  validation_rules?: ValidationRules;
}

export interface WorkflowStepDefinition {
  id: string;
  title: string;
  description: string;
  service: string;
  action: string;
  requires_confirmation: boolean;
}

export interface WorkflowDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  icon: string;
  required_role: string;
  risk_level: RiskLevel;
  estimated_runtime: string;
  requires_confirmation: boolean;
  integrations: IntegrationType[];
  capabilities: CapabilityType[];
  parameter_schema: WorkflowParameter[];
  execution_steps: WorkflowStepDefinition[];
}

// ─────────────────────────────────────────────
// Phase 2 ExecutionPlan Contracts
// ─────────────────────────────────────────────

export interface FieldValidationError {
  field_id: string;
  field_label: string;
  message: string;
}

export interface ValidationSummary {
  is_valid: boolean;
  errors: FieldValidationError[];
}

export interface ExecutionPlanStep {
  step_id: string;
  order: number;
  title: string;
  description: string;
  service: string;
  action: string;
  requires_confirmation: boolean;
}

export interface ExecutionPlan {
  plan_id: string;
  workflow_id: string;
  workflow_version: string;
  workflow_name: string;
  generated_at: string;
  generated_by?: string;
  parameters: Record<string, any>;
  estimated_runtime: string;
  risk_level: RiskLevel;
  requires_confirmation: boolean;
  integrations: IntegrationType[];
  capabilities: CapabilityType[];
  execution_steps: ExecutionPlanStep[];
  validation_summary: ValidationSummary;
}

// ─────────────────────────────────────────────
// Phase 5 Approval Contracts
// ─────────────────────────────────────────────

export interface ApprovalRequestModel {
  request_id: string;
  execution_id?: string;
  plan_id: string;
  workflow_id: string;
  workflow_name: string;
  approver_role: string;
  approver_user_id?: string;
  reason: string;
  status: ApprovalLifecycleState;
  created_at: string;
  expires_at?: string;
  decision_at?: string;
  comments?: string;
  plan: ExecutionPlan;
}

// ─────────────────────────────────────────────
// Phase 3 Execution Result Contracts
// ─────────────────────────────────────────────

export interface StepResult {
  step_id: string;
  status: WorkflowRunStatus;
  started_at: string;
  finished_at: string;
  duration: number;
  outputs: Record<string, any>;
  warnings: string[];
  error?: string;
  retryable: boolean;
}

// ─────────────────────────────────────────────
// Legacy / Compatibility Types (used by workflowService)
// ─────────────────────────────────────────────

export interface WorkflowToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  label: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface WorkflowTool {
  name: string;
  description: string;
  requires_confirmation: boolean;
  parameters: WorkflowToolParameter[];
}

export interface WorkflowExecuteRequest {
  workflow_id: string;
  parameters: Record<string, any>;
  triggered_by?: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: WorkflowRunStatus;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Phase 3 Execution Result Contracts
// ─────────────────────────────────────────────

export interface ExecutionResult {
  execution_id: string;
  workflow_id: string;
  workflow_version: string;
  overall_status: WorkflowRunStatus;
  total_duration: number;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  step_results: StepResult[];
  execution_summary: Record<string, any>;
  executed_at: string;
}
