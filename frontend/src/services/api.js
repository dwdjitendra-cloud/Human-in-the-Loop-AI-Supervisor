import axios from 'axios';

// Prefer env override for local/dev; fallback to deployed API to avoid breaking production
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'https://human-in-the-loop-ai-supervisor-0umh.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supervisorToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const helpRequestsAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/help-requests?page=${page}&limit=${limit}`),
  getPending: (page = 1, limit = 10) => api.get(`/help-requests/pending?page=${page}&limit=${limit}`),
  getResolved: (page = 1, limit = 10) => api.get(`/help-requests/resolved?page=${page}&limit=${limit}`),
  getUnresolved: (page = 1, limit = 10) => api.get(`/help-requests/unresolved?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/help-requests/${id}`),
  create: (data) => api.post('/help-requests', data),
  resolve: (id, data) => api.post(`/help-requests/${id}/resolve`, data),
  delete: (id) => api.delete(`/help-requests/${id}`),
  simulateLivekitCall: (data) => api.post('/help-requests/simulate-livekit-call', data),
};

export const knowledgeBaseAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/knowledge-base?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/knowledge-base/${id}`),
  create: (data) => api.post('/knowledge-base', data),
  update: (id, data) => api.put(`/knowledge-base/${id}`, data),
  delete: (id) => api.delete(`/knowledge-base/${id}`),
  search: (query, page = 1, limit = 10) => api.get(`/knowledge-base/search?q=${query}&page=${page}&limit=${limit}`),
};

export const supervisorsAPI = {
  register: (data) => api.post('/supervisors/register', data),
  login: (data) => api.post('/supervisors/login', data),
  getAll: () => api.get('/supervisors'),
  getById: (id) => api.get(`/supervisors/${id}`),
};

export const aiAgentAPI = {
  simulateCall: (data) => api.post('/simulate-call', data),
};

export default api;
