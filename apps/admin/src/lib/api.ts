import axios from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

function isEnveloped(data: unknown): data is { success: boolean; data: unknown; meta: unknown; error: unknown } {
  return (
    data !== null &&
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data &&
    'error' in data
  );
}

if (typeof window !== 'undefined') {
  api.interceptors.response.use(
    (response) => {
      if (isEnveloped(response.data)) {
        return { ...response, data: response.data.data };
      }
      return response;
    },
    async (error) => {
      if (error.response?.data && isEnveloped(error.response.data) && error.response.data.error) {
        error.response.data = error.response.data.error;
      }

      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          useAuthStore.getState().login(data.user, data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    },
  );

  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
