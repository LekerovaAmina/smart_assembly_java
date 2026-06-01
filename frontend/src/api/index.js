import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Request interceptor — attach Bearer token
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('sa_token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendCode = (phone) =>
  api.post('/auth/send-code', { phone });

export const verifyCode = (phone, code) =>
  api.post('/auth/verify-code', { phone, code });

// ── Events ────────────────────────────────────────────────────────────────────
export const getEvents = () =>
  api.get('/events');

export const getHrEvents = () =>
  api.get('/events/hr');

export const getEventById = (id) =>
  api.get(`/events/${id}`);

export const registerEvent = (id) =>
  api.post(`/events/${id}/register`);

export const unregisterEvent = (id) =>
  api.delete(`/events/${id}/register`);

export const getMyResponses = () =>
  api.get('/events/my-responses');

// ── Profile & hours ───────────────────────────────────────────────────────────
export const getMe = () =>
  api.get('/users/me');

export const getMyHours = () =>
  api.get('/volunteers/me/hours');

// ── Rating (stub — sort by totalHours) ───────────────────────────────────────
export const getRating = () =>
  api.get('/users?sort=totalHours,desc&size=50');

export default api;
