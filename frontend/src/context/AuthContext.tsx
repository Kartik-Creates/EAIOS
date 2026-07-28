/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, LoginPayload, AuthState } from '@/types/auth.types';
import { authService } from '@/services/authService';
import { storage } from '@/utils/storage';

export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  verifySession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(storage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState<string | null>(storage.getRefreshToken());
  const [isLoading, setIsLoading] = useState<boolean>(true); // start true to check session on mount
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getAccessToken());

  /**
   * Hydrates the user session.
   * If a token exists, calls /auth/me to get the User object.
   * Interceptor handles refresh automatically if access code is expired but valid refresh exists.
   */
  const verifySession = useCallback(async () => {
    const token = storage.getAccessToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userData = await authService.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Interceptor will log out if neither token works
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
      setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initializes session validation on mount
   */
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  /**
   * Log into the application and acquire tokens.
   */
  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const tokens = await authService.login(payload);
      
      storage.setAccessToken(tokens.access_token);
      storage.setRefreshToken(tokens.refresh_token);
      
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      setIsAuthenticated(true);

      // Fetch user data right after acquiring tokens
      const userData = await authService.me();
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log out from application and clear tokens locally and on backend.
   */
  const logout = async () => {
    try {
      if (isAuthenticated) {
        await authService.logout();
      }
    } catch (e) {
      console.warn("Logout request failed, clearing local state anyway.", e);
    } finally {
      storage.clearAuthTokens();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      logout,
      verifySession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
