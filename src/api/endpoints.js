import api from './axios.js';

// ── Auth ────────────────────────────────────────────────────────────────
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  google: (credential) => api.post('/auth/google', { credential }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgot: (email) => api.post('/auth/forgot-password', { email }),
  resetOtp: ({ email, otp, password }) =>
    api.post('/auth/reset-password-otp', { email, otp, password }),
  reset: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// ── Users ───────────────────────────────────────────────────────────────
export const userApi = {
  updateProfile: (payload) => api.put('/users/profile', payload),
  changePassword: (payload) => api.put('/users/password', payload),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Materials ───────────────────────────────────────────────────────────
export const materialApi = {
  list: (params) => api.get('/materials', { params }),
  get: (id) => api.get(`/materials/${id}`),
  upload: (formData) =>
    api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, payload) => api.put(`/materials/${id}`, payload),
  remove: (id) => api.delete(`/materials/${id}`),
};

// ── Quizzes ─────────────────────────────────────────────────────────────
export const quizApi = {
  list: (params) => api.get('/quizzes', { params }),
  get: (id, params) => api.get(`/quizzes/${id}`, { params }),
  generate: (payload) => api.post('/quizzes/generate', payload),
  create: (payload) => api.post('/quizzes', payload),
  remove: (id) => api.delete(`/quizzes/${id}`),
};

// ── Attempts ────────────────────────────────────────────────────────────
export const attemptApi = {
  submit: (payload) => api.post('/attempts', payload),
  history: (params) => api.get('/attempts', { params }),
  get: (id) => api.get(`/attempts/${id}`),
};

// ── Chat ────────────────────────────────────────────────────────────────
export const chatApi = {
  sessions: () => api.get('/chat'),
  session: (id) => api.get(`/chat/${id}`),
  send: (payload) => api.post('/chat', payload),
  remove: (id) => api.delete(`/chat/${id}`),
};

// ── Courses ─────────────────────────────────────────────────────────────
export const courseApi = {
  list: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (payload) => api.post('/courses', payload),
  update: (id, payload) => api.put(`/courses/${id}`, payload),
  remove: (id) => api.delete(`/courses/${id}`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  unenroll: (id) => api.delete(`/courses/${id}/enroll`),
  addResource: (id, payload) => api.post(`/courses/${id}/resources`, payload),
};

// ── Analytics ───────────────────────────────────────────────────────────
export const analyticsApi = {
  student: () => api.get('/analytics/student'),
  teacher: () => api.get('/analytics/teacher'),
  admin: () => api.get('/analytics/admin'),
};

// ── Admin ───────────────────────────────────────────────────────────────
export const adminApi = {
  users: (params) => api.get('/admin/users', { params }),
  setRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  setActive: (id, isActive) => api.put(`/admin/users/${id}/active`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  flagged: () => api.get('/admin/materials/flagged'),
  flagMaterial: (id, isFlagged) => api.put(`/admin/materials/${id}/flag`, { isFlagged }),
  removeMaterial: (id) => api.delete(`/admin/materials/${id}`),
};
