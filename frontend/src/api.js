import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

API.interceptors.request.use(config => {
  console.log('REQUEST:', config.method?.toUpperCase(), config.url, config.params || config.data || '');
  return config;
});

API.interceptors.response.use(
  response => {
    console.log('RESPONSE:', response.status, response.data);
    return response;
  },
  error => {
    console.error('ERROR:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const userAPI = {
  register: (data) => API.post('/users/register', data),
  login: (data) => API.post('/users/login', data),
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`)
};

export const ticketAPI = {
  create: (data) => API.post('/tickets', data),
  getAll: () => API.get('/tickets'),
  getById: (id) => API.get(`/tickets/${id}`),
  getByUser: (userId) => API.get(`/tickets/user/${userId}`),
  getByAgent: (agentId) => API.get(`/tickets/agent/${agentId}`),
  getByStatus: (status) => API.get('/tickets', { params: { status } }), // query param
  update: (id, data) => API.put(`/tickets/${id}`, data),
  updateStatus: (id, status) => API.patch(`/tickets/${id}/status`, { status }),
  delete: (id) => API.delete(`/tickets/${id}`)
};

export const messageAPI = {
  send: (data) => API.post('/messages', data),
  getByTicket: (ticketId) => API.get(`/messages/ticket/${ticketId}`),
  getAll: () => API.get('/messages')
};

export const aiAPI = {
  chat: (data) => API.post('/ai/chat', data),
  getConfig: () => API.get('/ai/config'),
  suggestReply: (ticketId, params) => API.get(`/ai/suggest-reply/${ticketId}`, { params }),
  suggestReplyPost: (ticketId, data) => API.post(`/ai/suggest-reply/${ticketId}`, data),
  assistTicket: (ticketId, data) => API.post(`/ai/ticket-assist/${ticketId}`, data || {}),
  replyTicketWithAi: (ticketId, data) => API.post(`/ai/ticket-reply/${ticketId}`, typeof data === 'string' ? { message: data } : data)
};

export default API;
