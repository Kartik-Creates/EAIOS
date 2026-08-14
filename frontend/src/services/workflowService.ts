import { apiClient } from './axios';
import type {
  WorkflowDefinition,
  WorkflowParameter,
  WorkflowCategory,
  ExecutionPlan,
  ExecutionResult,
  ApprovalRequestModel,
  ApprovalLifecycleState,
  WorkflowTool,
  WorkflowExecuteRequest,
  WorkflowRun,
} from '@/types/workflow.types';

export const workflowService = {
  /**
   * Fetches registered workflow definitions (with optional category and search query).
   */
  listWorkflows: async (params?: { category?: WorkflowCategory; search?: string }): Promise<WorkflowDefinition[]> => {
    const response = await apiClient.get<WorkflowDefinition[]>('/workflows', { params });
    return response.data;
  },

  /**
   * Fetches available workflow categories.
   */
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/workflows/categories');
    return response.data;
  },

  /**
   * Fetches full metadata definition for a workflow by ID.
   */
  getWorkflowDefinition: async (id: string): Promise<WorkflowDefinition> => {
    const response = await apiClient.get<WorkflowDefinition>(`/workflows/${id}`);
    return response.data;
  },

  /**
   * Fetches parameter schema for dynamic UI form generation.
   */
  getParameters: async (id: string): Promise<WorkflowParameter[]> => {
    const response = await apiClient.get<WorkflowParameter[]>(`/workflows/${id}/parameters`);
    return response.data;
  },

  /**
   * Phase 2: Generates an immutable ExecutionPlan preview for a workflow and parameter inputs.
   */
  createPlan: async (workflowId: string, parameters: Record<string, any>): Promise<ExecutionPlan> => {
    const response = await apiClient.post<ExecutionPlan>(`/workflows/${workflowId}/plan`, parameters);
    return response.data;
  },

  /**
   * Phase 3 & 5: Executes an ExecutionPlan using Orchestration Engine and returns ExecutionResult.
   */
  executePlan: async (plan: ExecutionPlan): Promise<ExecutionResult> => {
    const response = await apiClient.post<ExecutionResult>('/workflows/execute', plan);
    return response.data;
  },

  /**
   * Phase 5: List approval requests.
   */
  listApprovals: async (status?: ApprovalLifecycleState): Promise<ApprovalRequestModel[]> => {
    const response = await apiClient.get<ApprovalRequestModel[]>('/workflows/approvals', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  /**
   * Phase 5: Approve pending request & resume workflow execution.
   */
  approveRequest: async (requestId: string, comments?: string): Promise<ExecutionResult> => {
    const response = await apiClient.post<ExecutionResult>(`/workflows/approvals/${requestId}/approve`, { comments });
    return response.data;
  },

  /**
   * Phase 5: Reject pending request & terminate execution.
   */
  rejectRequest: async (requestId: string, comments?: string): Promise<ExecutionResult> => {
    const response = await apiClient.post<ExecutionResult>(`/workflows/approvals/${requestId}/reject`, { comments });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // Legacy / Compatibility Methods
  // ─────────────────────────────────────────────

  listTools: async (): Promise<WorkflowTool[]> => {
    const response = await apiClient.get<WorkflowDefinition[]>('/workflows');
    return response.data.map((w) => ({
      name: w.id,
      description: w.description,
      requires_confirmation: w.requires_confirmation,
      parameters: w.parameter_schema.map((p) => ({
        name: p.id,
        type: p.type === 'number' ? 'number' : p.type === 'boolean' ? 'boolean' : 'string',
        label: p.label,
        description: p.description,
        required: p.required,
        default: p.default_value,
      })),
    }));
  },

  execute: async (payload: WorkflowExecuteRequest): Promise<WorkflowRun> => {
    const response = await apiClient.post<WorkflowRun>('/workflows/execute', payload);
    return response.data;
  },
};
