import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if JWT token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillswap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear localStorage
      const isAuthUrl = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile/me', data),
  addOfferedSkill: (data) => api.post('/users/skills/offered', data),
  deleteOfferedSkill: (skillId) => api.delete(`/users/skills/offered/${skillId}`),
  addWantedSkill: (data) => api.post('/users/skills/wanted', data),
  deleteWantedSkill: (skillId) => api.delete(`/users/skills/wanted/${skillId}`),
  getFriends: () => api.get('/users/friends/list'),
  getReviews: (userId) => api.get(`/users/${userId}/reviews`),
};

export const skillsAPI = {
  getTaxonomy: () => api.get('/skills/taxonomy'),
  getPopular: () => api.get('/skills/popular'),
};

export const matchesAPI = {
  explore: (params) => api.get('/matches/explore', { params }),
  getRecommendations: () => api.get('/matches/recommendations'),
  getSurveyOptions: () => api.get('/matches/survey-options'),
  getSkillRecommendations: (answers) => api.post('/matches/skill-recommendations', answers),
};

export const requestsAPI = {
  send: (data) => api.post('/requests/send', data),
  getIncoming: () => api.get('/requests/incoming'),
  getOutgoing: () => api.get('/requests/outgoing'),
  respond: (requestId, action) => {
    const payload = typeof action === 'string'
      ? { action: action.startsWith('accept') ? 'accept' : 'decline' }
      : { action: (action?.action || action?.status || 'accept').startsWith('accept') ? 'accept' : 'decline' };
    return api.post(`/requests/${requestId}/respond`, payload);
  },
  cancel: (requestId) => api.delete(`/requests/${requestId}`),
};

export const messagesAPI = {
  getHistory: (partnerId) => api.get(`/messages/${partnerId}`),
  sendMessage: (data) => api.post('/messages/send', data),
  getRecentConversations: () => api.get('/messages/conversations/recent'),
  getConversations: () => api.get('/messages/conversations/recent'),
  uploadMedia: (formData) => api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  upload: (formData) => api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const sessionsAPI = {
  schedule: (data) => api.post('/sessions/', data),
  getSessions: () => api.get('/sessions/'),
  leaveReview: (data) => api.post('/sessions/review', data),
};

export const chatbotAPI = {
  sendMessage: (message, history = []) => api.post('/chatbot/message', { message, history }),
};

export default api;
