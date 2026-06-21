import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// ── Интерцепторы ──────────────────────────────────────────────────────────────

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('sa_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

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

// ── Users ─────────────────────────────────────────────────────────────────────
export const getMe = () =>
  api.get('/users/me');

export const getUsers = (params = {}) =>
  api.get('/users', { params });

export const getUserById_hr = (id) =>
  api.get(`/users/${id}`);

export const updateUserStatus = (id, status) =>
  api.patch(`/users/${id}/status`, { status });

export const updateUserRole = (id, role) =>
  api.patch(`/users/${id}/role`, { role });

// ── Events ────────────────────────────────────────────────────────────────────
export const getEvents = () =>
  api.get('/events');

export const getHrEvents = () =>
  api.get('/events/hr');

export const getEventById = (id) =>
  api.get(`/events/${id}`);

export const createEvent = (eventData) =>
  api.post('/events', eventData);

export const updateEvent = (id, eventData) =>
  api.put(`/events/${id}`, eventData);

export const publishEvent = (id) =>
  api.post(`/events/${id}/publish`);

export const cancelEvent = (id) =>
  api.post(`/events/${id}/cancel`);

export const deleteEvent = (id) =>
  api.delete(`/events/${id}`);

export const completeEvent = (id) =>
  api.post(`/events/${id}/complete`);

export const startEvent = (id) =>
  api.post(`/events/${id}/start`);

export const closeEvent = (id) =>
  api.post(`/events/${id}/close`);

export const getEventQr = (id) =>
  api.get(`/events/${id}/qr`);

// ── Event responses ───────────────────────────────────────────────────────────
export const registerEvent = (id) =>
  api.post(`/events/${id}/register`);

export const unregisterEvent = (id) =>
  api.delete(`/events/${id}/register`);

export const getMyResponses = () =>
  api.get('/events/my-responses');

// ── Attendees ─────────────────────────────────────────────────────────────────
export const getAttendees = (eventId) =>
  api.get(`/events/${eventId}/attendees`);

export const updateAttendeeHours = (eventId, userId, data) =>
  api.patch(`/events/${eventId}/attendees/${userId}/hours`, data);

export const checkinSelf = (eventId) =>
  api.post(`/events/${eventId}/self-checkin`);

export const checkinUser = (eventId, userId) =>
  api.post(`/events/${eventId}/checkin`, { userId });

// ── Volunteer hours ───────────────────────────────────────────────────────────
export const getMyHours = () =>
  api.get('/volunteers/me/hours');

export const getMyHoursHistory = (params = {}) =>
  api.get('/volunteers/me/hours/history', { params });

export const adjustVolunteerHours = (volunteerId, data) =>
  api.post(`/volunteers/${volunteerId}/hours/adjust`, data);

// ── Rating ────────────────────────────────────────────────────────────────────
export const getRating = () =>
  api.get('/rating');

// ── Registration ──────────────────────────────────────────────────────────────
export const getPendingRequests = (params = {}) =>
  api.get('/registration/pending', { params });

export const getAllRequests = (params = {}) =>
  api.get('/registration/all', { params });

export const getRegistrationById = (id) =>
  api.get(`/registration/${id}`);

export const approveRegistration = (id) =>
  api.post(`/registration/${id}/approve`);

export const rejectRegistration = (id, comment) =>
  api.post(`/registration/${id}/reject`, { comment });

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (params = {}) =>
  api.get('/notifications/my', { params });

export const getUnreadNotificationsCount = () =>
  api.get('/notifications/my/unread-count');

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.post('/notifications/read-all');

// ── Strikes ───────────────────────────────────────────────────────────────────
export const getMyStrikes = () =>
  api.get('/strikes/my');

export const getVolunteerStrikes = (volunteerId) =>
  api.get(`/strikes/volunteer/${volunteerId}`);

export const createStrike = (volunteerId, data) =>
  api.post(`/strikes/${volunteerId}`, data);

export const revokeStrike = (strikeId) =>
  api.delete(`/strikes/${strikeId}`);

export const createAppeal = (strikeId, data) =>
  api.post(`/strikes/${strikeId}/appeal`, data);

export const getPendingAppeals = () =>
  api.get('/strikes/appeals/pending');

export const approveAppeal = (appealId) =>
  api.post(`/strikes/appeals/${appealId}/approve`);

export const rejectAppeal = (appealId, comment) =>
  api.post(`/strikes/appeals/${appealId}/reject`, { comment });

export default api;