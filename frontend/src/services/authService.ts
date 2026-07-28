import { apiClient } from './axios';
import type { RegisterPayload, LoginPayload, Token, User, RefreshRequest } from '@/types/auth.types';

export const authService = {
  /**
   * Register a new user account.
   * @param payload User details for registration
   * @returns User data of newly created account
   */
  register: async (payload: RegisterPayload): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', payload);
    return response.data;
  },

  /**
   * Log into an existing account.
   * NOTE: Backend expects application/x-www-form-urlencoded
   * @param payload Username and password
   * @returns Token payload (access_token, refresh_token)
   */
  login: async (payload: LoginPayload): Promise<Token> => {
    // Convert to URLSearchParams for application/x-www-form-urlencoded
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

  /**
   * Returns current authenticated user metadata. 
   */
  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Refreshes the access token using a refresh token.
   */
  refresh: async (payload: RefreshRequest): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/refresh', payload);
    return response.data;
  },

  /**
   * Logs out the user (increments token version in backend, invalidating current tokens).
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  }
};
