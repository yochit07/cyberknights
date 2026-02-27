import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
});

// Attach auth token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ck_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('ck_token');
            localStorage.removeItem('ck_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ---- Auth ----
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// ---- APK ----
export const apkApi = {
    upload: (formData, onProgress) => api.post('/apk/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (e) => {
            if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        }
    }),
};

// ---- URL Scanner ----
export const urlApi = {
    scan: (url) => api.post('/url/scan', { url }),
    history: (page = 1) => api.get(`/url/history?page=${page}`),
};

// ---- Reports ----
export const reportsApi = {
    getAll: (page = 1, type) => api.get(`/reports?page=${page}${type ? `&type=${type}` : ''}`),
    getOne: (id) => api.get(`/reports/${id}`),
    getStats: () => api.get('/reports/stats'),
    download: (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
    delete: (id) => api.delete(`/reports/${id}`),
};

// ---- Admin ----
export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    getScans: (page = 1) => api.get(`/admin/scans?page=${page}`),
    getSignatures: () => api.get('/admin/signatures'),
    addSignature: (data) => api.post('/admin/signatures', data),
    deleteSignature: (id) => api.delete(`/admin/signatures/${id}`),
};

export default api;
