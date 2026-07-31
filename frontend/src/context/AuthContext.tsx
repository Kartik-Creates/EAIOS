/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, LoginPayload, AuthState } from '@/types/auth.types';
import { authService } from '@/services/authService';
import { storage } from '@/utils/storage';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

// CRITICAL SECURITY WARNING:
// VITE_BYPASS_AUTH must NEVER be set to 'true' in any deployed, staging, demo,
// or production environment. It bypasses all authentication and grants full 'admin'
// superuser privileges to an unauthenticated mock session.
const MOCK_USER: User = {
  id: 'local-dev-bypass',
  email: 'dev@eaios.local',
  full_name: 'Development Bypass',
  is_active: true,
  is_superuser: true,
  role: 'admin',
};


export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  verifySession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? MOCK_USER : null);
  const [accessToken, setAccessToken] = useState<string | null>(BYPASS_AUTH ? 'local-dev-bypass-token' : storage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState<string | null>(BYPASS_AUTH ? 'local-dev-bypass-refresh' : storage.getRefreshToken());
  const [isLoading, setIsLoading] = useState<boolean>(!BYPASS_AUTH);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(BYPASS_AUTH || !!storage.getAccessToken());

  /**
   * Hydrates the user session.
   * If a token exists, calls /auth/me to get the User object.
   * Interceptor handles refresh automatically if access code is expired but valid refresh exists.
   */
  const verifySession = useCallback(async () => {
    if (BYPASS_AUTH) {
      setUser(MOCK_USER);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

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
    if (BYPASS_AUTH) {
      setUser(MOCK_USER);
      setIsAuthenticated(true);
      return;
    }

    setIsLoading(true);
    try {
      const tokens = await authService.login(payload);
      
      storage.setAccessToken(tokens.access_token);
      storage.setRefreshToken(tokens.refresh_token);
      
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      setIsAuthenticated(true);

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
    if (!BYPASS_AUTH) {
      try {
        if (isAuthenticated) {
          await authService.logout();
        }
      } catch (e) {
        console.warn("Logout request failed, clearing local state anyway.", e);
      }
    }
    
    storage.clearAuthTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user: BYPASS_AUTH ? MOCK_USER : user,
      accessToken: BYPASS_AUTH ? 'local-dev-bypass-token' : accessToken,
      refreshToken: BYPASS_AUTH ? 'local-dev-bypass-refresh' : refreshToken,
      isAuthenticated: BYPASS_AUTH ? true : isAuthenticated,
      isLoading,
      login,
      logout,
      verifySession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
