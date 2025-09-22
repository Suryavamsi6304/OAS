import api from '../utils/api';

class AuthService {
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  }

  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  }

  async verifyToken() {
    const response = await api.get('/api/auth/verify');
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }
}

export default new AuthService();