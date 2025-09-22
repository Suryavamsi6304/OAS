import api from '../utils/api';

class ResultService {
  async getStudentResults() {
    const response = await api.get('/api/results/student');
    return response.data;
  }

  async getAllResults() {
    const response = await api.get('/api/results/all');
    return response.data;
  }

  async getBatchPerformance() {
    const response = await api.get('/api/results/batch-performance');
    return response.data;
  }

  async getLeaderboard() {
    const response = await api.get('/api/results/my-batch-leaderboard');
    return response.data;
  }

  async gradeAnswer(resultId, gradeData) {
    const response = await api.put(`/api/results/${resultId}/grade`, gradeData);
    return response.data;
  }

  async getAnalytics() {
    const response = await api.get('/api/analytics');
    return response.data;
  }
}

export default new ResultService();