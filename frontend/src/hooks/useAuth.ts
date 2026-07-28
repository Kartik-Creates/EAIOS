import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';

/**
 * Custom hook to consume the global AuthContext.
 * Ensures it is used within an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
