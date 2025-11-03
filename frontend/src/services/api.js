import axios from 'axios';

const envBase = import.meta?.env?.VITE_API_BASE_URL;
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
const API_BASE_URL = envBase || (isLocalhost ? 'http://localhost:5000/api' : undefined);

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error('[API] VITE_API_BASE_URL is not set. Please configure it to your backend URL (e.g., https://<render>.onrender.com/api).');
}

if (import.meta?.env?.DEV) {
  // Lightweight debug to verify which API base is used in dev
  // eslint-disable-next-line no-console
  console.debug('[API] baseURL =', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Voice endpoints for TTS and voice replies
export const voiceAPI = {
  // Returns audio bytes (arraybuffer)
  tts: (text) => api.get('/voice/tts', { params: { text }, responseType: 'arraybuffer' }),
  reply: (data) => api.post('/voice/reply', data),
  livekitSimulate: (data) => api.post('/livekit/simulate-call', data),
  token: ({ identity, roomName }) => api.post('/livekit/token', { identity, roomName }),
  // Send audio blob; receive transcript + answer + audioBase64
  sttRespond: (audioBlob, voice) => {
    const fd = new FormData();
    fd.append('audio', audioBlob, 'clip.webm');
    if (voice) fd.append('voice', voice);
    // Do not set Content-Type manually for FormData
    return api.post('/voice/stt-respond', fd, {
      headers: { 'Accept': 'application/json' },
    });
  },
};

export default api;
