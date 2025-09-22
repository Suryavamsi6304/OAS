import api from '../utils/api';

class UserService {
  async getUsers() {
    const response = await api.get('/api/admin/users');
    return response.data;
  }

  async createUser(userData) {
    const response = await api.post('/api/admin/users', userData);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await api.put(`/api/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  }

  async approveUser(id, approved) {
    const response = await api.put(`/api/admin/approve-user/${id}`, { approved });
    return response.data;
  }

  async getPendingApprovals() {
    const response = await api.get('/api/admin/pending-approvals');
    return response.data;
  }

  async updateUserStatus(id, isActive) {
    const response = await api.put(`/api/admin/users/${id}/status`, { isActive });
    return response.data;
  }
}

export default new UserService();