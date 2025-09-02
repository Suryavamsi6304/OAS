const { Result, Exam, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get student results
 */
const getStudentResults = async (req, res) => {
  try {
    console.log('Getting results for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const results = await Result.findAll({
      where: { studentId: req.user.id },
      include: [{
        model: Exam,
        as: 'exam',
        attributes: ['id', 'title', 'description', 'type', 'passingScore', 'totalPoints', 'duration']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log('Found results:', results.length);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get student results error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

/**
 * Get all results (Admin/Mentor)
 */
const getAllResults = async (req, res) => {
  try {
    const results = await Result.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'username']
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['title', 'questions']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get analytics data (Admin only)
 */
const getAnalytics = async (req, res) => {
  try {
    const totalExams = await Exam.count();
    const totalResults = await Result.count();
    const totalStudents = await User.count({ where: { role: 'learner' } });
    
    const avgScoreResult = await Result.findOne({
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('percentage')), 'avgScore']
      ]
    });

    res.json({
      success: true,
      data: {
        totalExams,
        totalResults,
        totalStudents,
        averageScore: Math.round(avgScoreResult?.dataValues?.avgScore || 0)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Grade answer (Mentor/Admin only)
 */
const gradeAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, points } = req.body;

    const result = await Result.findByPk(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Update the specific answer
    const answers = result.answers.map(answer => {
      if (answer.questionId === questionId) {
        return {
          ...answer,
          points: parseInt(points),
          needsReview: false,
          isCorrect: points > 0
        };
      }
      return answer;
    });

    // Recalculate total score
    const newScore = answers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    
    await result.update({
      answers,
      score: newScore
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getStudentResults,
  getAllResults,
  getAnalytics,
  gradeAnswer
};