import { apiClient } from './axios';
import type { AdminUser } from '@/types/admin.types';

export const adminService = {
  /**
   * Fetches the complete list of system users.
   * Requires backend 'admin' role privileges.
   * @returns Array of AdminUser
   */
  listUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>('/admin/users');
    return response.data;
  }
};
