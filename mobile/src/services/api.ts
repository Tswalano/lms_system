import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const api = axios.create({ baseURL: API_BASE_URL });

async function getTokens() {
  const accessToken = await SecureStore.getItemAsync('accessToken');
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  return { accessToken, refreshToken };
}

async function setTokens(accessToken: string, idToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('idToken', idToken);
  if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
}

async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('idToken');
  await SecureStore.deleteItemAsync('refreshToken');
}

api.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = await getTokens();
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        await setTokens(data.accessToken, data.idToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await clearTokens();
        throw error;
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, code, newPassword }),
  completeNewPassword: (username: string, newPassword: string, session: string) =>
    api.post('/auth/complete-new-password', { username, newPassword, session }),
  getMe: () => api.get('/users/me'),
  setTokens,
  clearTokens,
};

// Leave
export const leaveApi = {
  applyLeave: (payload: {
    leave_type: string;
    leave_start: string;
    leave_end: string;
    leave_comment: string;
    leave_length: 'full_day' | 'half_day';
  }) => api.post('/leave/apply-leave', payload),

  getLeaveHistory: () => api.get('/leave/leave-history'),

  getUserLeaveHistory: (userId: string) => api.get(`/leave/leave-history/${userId}`),

  updateLeave: (
    leaveId: number,
    payload: {
      leave_type: string;
      leave_start: string;
      leave_end: string;
      leave_comment: string;
      leave_length: 'full_day' | 'half_day';
    }
  ) => api.put(`/leave/${leaveId}`, payload),

  cancelLeave: (leaveId: number, feedback: string) =>
    api.patch(`/leave/${leaveId}/cancel`, { feedback }),

  // Admin
  getAllLeaveRequests: (page = 1, limit = 20) =>
    api.get(`/leave/all-leave-requests?page=${page}&limit=${limit}`),

  approveLeave: (requestId: number, comment: string) =>
    api.post(`/leave/${requestId}/approve`, { comment }),

  rejectLeave: (requestId: number, comment: string) =>
    api.post(`/leave/${requestId}/reject`, { comment }),
};

// Users (admin)
export const usersApi = {
  getAllUsers: () => api.get('/users'),
};
