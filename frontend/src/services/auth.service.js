import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },

  async register(credentials) {
    const response = await api.post('/auth/register', credentials);
    return response.data.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  async updateProfile(data) {
    const response = await api.put('/auth/profile', data);
    return response.data.data;
  },

  async changePassword(data) {
    const response = await api.put('/auth/password', data);
    return response.data.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
