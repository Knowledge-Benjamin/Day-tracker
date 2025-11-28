import axios from 'axios';
import { store } from '../store';
import { updateTokens, logout } from '../store/slices/authSlice';

//const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'http://192.168.1.2:5000/api';
// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.auth.accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const state = store.getState();
                const refreshToken = state.auth.refreshToken;

                if (!refreshToken) {
                    store.dispatch(logout());
                    return Promise.reject(error);
                }

                // Try to refresh token
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                store.dispatch(logout());
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    register: (email: string, password: string, name?: string) =>
        api.post('/auth/register', { email, password, name }),

    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    refresh: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken })
};

export const goalsAPI = {
    getAll: () => api.get('/goals'),

    getById: (id: number) => api.get(`/goals/${id}`),

    create: (goal: any) => api.post('/goals', goal),

    update: (id: number, goal: any) => api.put(`/goals/${id}`, goal),

    delete: (id: number) => api.delete(`/goals/${id}`),

    toggle: (id: number) => api.patch(`/goals/${id}/toggle`)
};

export const dailyLogsAPI = {
    getByGoal: (goalId: number) => api.get(`/daily-logs/goal/${goalId}`),

    getById: (id: number) => api.get(`/daily-logs/${id}`),

    create: (log: any) => api.post('/daily-logs', log),

    delete: (id: number) => api.delete(`/daily-logs/${id}`),

    uploadAttachment: (logId: number, file: any) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/daily-logs/${logId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export const syncAPI = {
    sync: (changes: any[], lastSyncAt: string | null) =>
        api.post('/sync/sync', { changes, lastSyncAt }),

    getStatus: () => api.get('/sync/status')
};
