import { apiClient } from './axios';
import type { WorkflowTool, WorkflowExecuteRequest, WorkflowRun } from '@/types/workflow.types';

export const workflowService = {
  /**
   * Fetches the fixed menu of available workflow tools.
   * @returns Array of tool definitions with parameter schemas
   */
  listTools: async (): Promise<WorkflowTool[]> => {
    const response = await apiClient.get<WorkflowTool[]>('/workflow/tools');
    return response.data;
  },

  /**
   * Executes a workflow tool. Write-action tools require human confirmation.
   * @param payload Tool name, parameters, and optional confirmation flag
   * @returns Workflow run instance with status tracking
   */
  execute: async (payload: WorkflowExecuteRequest): Promise<WorkflowRun> => {
    const response = await apiClient.post<WorkflowRun>('/workflow/execute', payload);
    return response.data;
  },
};
