/**
 * Utility functions for interacting with browser localStorage.
 * Focused on managing authentication tokens and basic preferences.
 */

const ACCESS_TOKEN_KEY = 'eaios_access_token';
const REFRESH_TOKEN_KEY = 'eaios_refresh_token';

export const storage = {
  // --- Access Token ---
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  removeAccessToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  // --- Refresh Token ---
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // --- Global Auth Control ---
  clearAuthTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};
