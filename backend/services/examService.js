const { Exam, User, Result } = require('../models');
const { Op } = require('sequelize');

class ExamService {
  async createExam(examData, createdBy) {
    const exam = await Exam.create({
      ...examData,
      createdBy,
      totalPoints: this.calculateTotalPoints(examData.questions)
    });
    return exam;
  }

  async getExams(userRole, batchCode) {
    let whereClause = { isActive: true };
    
    // Filter by batch for learners
    if (userRole === 'learner' && batchCode) {
      whereClause.batchCode = batchCode;
    }

    const exams = await Exam.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });

    return exams;
  }

  async getExamById(id, userId, userRole) {
    const exam = await Exam.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'username']
      }]
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Check if user has already taken this exam
    if (userRole === 'learner') {
      const existingResult = await Result.findOne({
        where: { studentId: userId, examId: id }
      });

      if (existingResult) {
        throw new Error('You have already taken this exam');
      }
    }

    return exam;
  }

  async updateExam(id, examData, userId, userRole) {
    const exam = await Exam.findByPk(id);
    
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Only creator or admin can update
    if (userRole !== 'admin' && exam.createdBy !== userId) {
      throw new Error('Not authorized to update this exam');
    }

    const updatedExam = await exam.update({
      ...examData,
      totalPoints: this.calculateTotalPoints(examData.questions)
    });

    return updatedExam;
  }

  async deleteExam(id, userId, userRole) {
    const exam = await Exam.findByPk(id);
    
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Only creator or admin can delete
    if (userRole !== 'admin' && exam.createdBy !== userId) {
      throw new Error('Not authorized to delete this exam');
    }

    await exam.destroy();
    return { message: 'Exam deleted successfully' };
  }

  async submitExam(submissionData, userId) {
    const { examId, answers, timeSpent } = submissionData;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Check if already submitted
    const existingResult = await Result.findOne({
      where: { studentId: userId, examId }
    });

    if (existingResult) {
      throw new Error('Exam already submitted');
    }

    // Calculate score
    const { score, totalPoints, gradedAnswers } = this.calculateScore(exam.questions, answers);
    const percentage = Math.round((score / totalPoints) * 100);

    const result = await Result.create({
      studentId: userId,
      examId,
      answers: gradedAnswers,
      score,
      totalPoints,
      percentage,
      timeSpent: timeSpent || 0,
      status: 'completed',
      submittedAt: new Date()
    });

    return result;
  }

  calculateTotalPoints(questions) {
    return questions.reduce((total, question) => total + (question.points || 0), 0);
  }

  calculateScore(questions, answers) {
    let score = 0;
    const totalPoints = this.calculateTotalPoints(questions);
    const gradedAnswers = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      let points = 0;

      if (question.type === 'multiple-choice') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = userAnswer === correctOption?.text;
        points = isCorrect ? question.points : 0;
      } else if (question.type === 'true-false') {
        isCorrect = userAnswer === question.correctAnswer;
        points = isCorrect ? question.points : 0;
      } else if (question.type === 'essay' || question.type === 'coding') {
        // These need manual grading
        points = 0;
        isCorrect = null;
      }

      score += points;
      gradedAnswers.push({
        questionId: index,
        answer: userAnswer,
        isCorrect,
        points,
        needsReview: question.type === 'essay' || question.type === 'coding'
      });
    });

    return { score, totalPoints, gradedAnswers };
  }
}

module.exports = new ExamService();