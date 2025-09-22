import api from '../utils/api';

class ExamService {
  async getExams() {
    const response = await api.get('/api/exams');
    return response.data;
  }

  async getExamById(id) {
    const response = await api.get(`/api/exams/${id}`);
    return response.data;
  }

  async createExam(examData) {
    const response = await api.post('/api/exams', examData);
    return response.data;
  }

  async updateExam(id, examData) {
    const response = await api.put(`/api/exams/${id}`, examData);
    return response.data;
  }

  async deleteExam(id) {
    const response = await api.delete(`/api/exams/${id}`);
    return response.data;
  }

  async submitExam(submissionData) {
    const response = await api.post('/api/exams/submit', submissionData);
    return response.data;
  }

  async getPracticeTests() {
    const response = await api.get('/api/practice-tests');
    return response.data;
  }

  async getSkillAssessments() {
    const response = await api.get('/api/skill-assessments');
    return response.data;
  }
}

export default new ExamService();