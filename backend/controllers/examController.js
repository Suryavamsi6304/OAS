const { Exam, Result, User, ReAttemptRequest, Notification } = require('../models');

/**
 * Create new exam (Admin only)
 */
const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all exams (including practice tests and skill assessments)
 */
const getExams = async (req, res) => {
  try {
    let whereClause = { isActive: true };
    
    // Filter by batch for learners
    if (req.user.role === 'learner' && req.user.batchCode) {
      whereClause.batchCode = req.user.batchCode;
    }
    
    const exams = await Exam.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get exam by ID for taking
 */
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }
    
    // Check batch access for learners
    if (req.user.role === 'learner' && exam.batchCode && req.user.batchCode !== exam.batchCode) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this exam'
      });
    }

    // Remove correct answers for students
    let examData = exam.toJSON();
    if (req.user.role === 'learner') {
      examData.questions = examData.questions.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
        options: q.options?.map(opt => ({
          text: opt.text,
          _id: opt._id
        }))
      }));
    }

    res.json({
      success: true,
      data: examData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Submit exam answers (including practice tests and skill assessments)
 */
const submitExam = async (req, res) => {
  try {
    console.log('Submit exam request:', req.body);
    const { examId, answers, timeSpent } = req.body;
    
    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID is required'
      });
    }
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      });
    }
    
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Check batch access for learners
    if (req.user.role === 'learner' && exam.batchCode && req.user.batchCode !== exam.batchCode) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this exam'
      });
    }
    
    console.log('Exam found:', { id: exam.id, title: exam.title, questionsCount: exam.questions?.length });

    // Check if already submitted (allow retakes for practice tests and approved re-attempts)
    const existingResult = await Result.findOne({
      where: {
        studentId: req.user.id,
        examId: examId
      }
    });

    // Check if there's an approved re-attempt request
    const { ReAttemptRequest } = require('../models');
    const approvedReAttempt = await ReAttemptRequest.findOne({
      where: {
        studentId: req.user.id,
        examId: examId,
        status: 'approved'
      }
    });

    if (existingResult && exam.type !== 'practice' && !approvedReAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Assessment already submitted'
      });
    }
    
    if (!exam.questions || !Array.isArray(exam.questions) || exam.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam has no questions configured'
      });
    }

    // Evaluate answers
    let score = 0;
    let negativeScore = 0;
    const evaluatedAnswers = answers.map(answer => {
      const question = exam.questions.find(q => q._id === answer.questionId);
      let isCorrect = false;
      let points = 0;
      let needsReview = false;

      if (!question) {
        console.warn(`Question not found for ID: ${answer.questionId}`);
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: false,
          points: 0,
          needsReview: true
        };
      }

      if (question.type === 'multiple-choice') {
        const correctOption = question.options?.find(opt => opt.isCorrect);
        isCorrect = correctOption && correctOption._id === answer.answer;
        if (isCorrect) {
          points = parseInt(question.points) || 1;
        } else if (exam.negativeMarking && answer.answer) {
          negativeScore += parseFloat(exam.negativeMarkingValue) || 0.25;
        }
      } else if (question.type === 'true-false') {
        isCorrect = question.correctAnswer === answer.answer;
        if (isCorrect) {
          points = parseInt(question.points) || 1;
        } else if (exam.negativeMarking && answer.answer) {
          negativeScore += parseFloat(exam.negativeMarkingValue) || 0.25;
        }
      } else if (question.type === 'essay' || question.type === 'coding') {
        needsReview = true;
        points = 0;
      }

      score += points;

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        points,
        needsReview
      };
    });

    const finalScore = Math.max(0, score - negativeScore);
    const totalPoints = parseInt(exam.totalPoints) || 1;
    const percentage = Math.round((finalScore / totalPoints) * 100);
    const passingScore = parseInt(exam.passingScore) || 70;
    const passed = percentage >= passingScore;

    // Handle existing results for practice tests and re-attempts
    let result;
    if (existingResult && (exam.type === 'practice' || approvedReAttempt)) {
      // Update existing result for practice tests or approved re-attempts
      await existingResult.update({
        answers: evaluatedAnswers,
        score: finalScore,
        totalPoints: totalPoints,
        percentage: percentage,
        timeSpent: timeSpent || 0,
        status: 'completed'
      });
      result = existingResult;
    } else {
      // Create new result
      result = await Result.create({
        studentId: req.user.id,
        examId: examId,
        answers: evaluatedAnswers,
        score: finalScore,
        totalPoints: totalPoints,
        percentage: percentage,
        timeSpent: timeSpent || 0,
        status: 'completed'
      });
    }

    res.json({
      success: true,
      data: {
        score: finalScore,
        totalPoints: totalPoints,
        percentage: percentage,
        passed,
        negativeMarks: negativeScore,
        testType: exam.type,
        canRetake: exam.type === 'practice'
      }
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * Update exam
 */
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    await exam.update(req.body);
    
    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete exam
 */
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user can delete this exam (admin can delete any, mentor can only delete their own)
    if (req.user.role === 'mentor' && exam.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete exams you created'
      });
    }

    // Delete related records first to avoid foreign key constraints
    const { ReAttemptRequest, Notification } = require('../models');
    
    // Delete related results
    await Result.destroy({ where: { examId: id } });
    
    // Delete related re-attempt requests
    await ReAttemptRequest.destroy({ where: { examId: id } });
    
    // Delete related notifications
    await Notification.destroy({ where: { relatedId: id } });
    
    // Now delete the exam
    await exam.destroy();
    
    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  submitExam,
  updateExam,
  deleteExam
};