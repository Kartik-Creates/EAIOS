import { apiClient } from './axios';
import type { RegisterPayload, LoginPayload, Token, User, RefreshRequest } from '@/types/auth.types';

export const authService = {
  register: async (payload: RegisterPayload): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', payload);
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<Token> => {
    const params = new URLSearchParams();
    params.append('username', payload.username);
    params.append('password', payload.password);

    const response = await apiClient.post<Token>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refresh: async (payload: RefreshRequest): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/refresh', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  updateProfile: async (data: { full_name?: string }): Promise<User> => {
    const response = await apiClient.put<User>('/auth/me', data);
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<{ detail: string }> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  }
};
