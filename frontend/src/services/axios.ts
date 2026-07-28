import axios from 'axios';
import { storage } from '@/utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Singleton Axios instance configured for EAIOS backend APIs.
 * Automatically handles JWT injection and 401 Unauthorized refresh rotation.
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor:
 * Injects the Bearer access token into the Authorization header of every request.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Captures 401 Unauthorized responses. If a refresh_token exists, attempts
 * to rotate tokens via POST /api/v1/auth/refresh.
 *  - If successful: retries the original request.
 *  - If failed: clears tokens and forces redirect to /login.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Explicitly check for 401 and prevent infinite retry loops via `_retry` flag
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = storage.getRefreshToken();
      
      if (refreshToken) {
        try {
          // Call original axios to avoid hitting the interceptor for the refresh call
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const newAccessToken = response.data.access_token;
          
          if (newAccessToken) {
            storage.setAccessToken(newAccessToken);
            
            // Re-apply the new token to the failed request and retry
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Token refresh failed (e.g. refresh token expired)
          storage.clearAuthTokens();
          // We use window.location as fallback. 
          // React Router should ideally handle this but this acts as safety net.
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, log out
        storage.clearAuthTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
