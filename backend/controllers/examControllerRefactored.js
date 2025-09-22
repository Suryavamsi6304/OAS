const examService = require('../services/examService');

class ExamController {
  async createExam(req, res) {
    try {
      const exam = await examService.createExam(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        data: exam
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getExams(req, res) {
    try {
      const exams = await examService.getExams(req.user.role, req.user.batchCode);
      
      res.json({
        success: true,
        data: exams
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getExamById(req, res) {
    try {
      const exam = await examService.getExamById(req.params.id, req.user.id, req.user.role);
      
      res.json({
        success: true,
        data: exam
      });
    } catch (error) {
      const statusCode = error.message === 'Exam not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateExam(req, res) {
    try {
      const exam = await examService.updateExam(req.params.id, req.body, req.user.id, req.user.role);
      
      res.json({
        success: true,
        message: 'Exam updated successfully',
        data: exam
      });
    } catch (error) {
      const statusCode = error.message === 'Exam not found' ? 404 : 
                        error.message.includes('Not authorized') ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteExam(req, res) {
    try {
      const result = await examService.deleteExam(req.params.id, req.user.id, req.user.role);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === 'Exam not found' ? 404 : 
                        error.message.includes('Not authorized') ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async submitExam(req, res) {
    try {
      const result = await examService.submitExam(req.body, req.user.id);
      
      res.json({
        success: true,
        message: 'Exam submitted successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ExamController();