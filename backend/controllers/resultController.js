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
          attributes: ['name', 'username', 'batchCode']
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

/**
 * Get batch-wise performance (Mentor only)
 */
const getBatchPerformance = async (req, res) => {
  try {
    const results = await Result.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'username', 'batchCode'],
          where: { role: 'learner' }
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['title', 'type', 'questions']
        }
      ],
      order: [['percentage', 'DESC']]
    });

    // Group by batch and question type
    const batchData = {};
    const batchStats = {};
    
    results.forEach(result => {
      const batchCode = result.student.batchCode || 'No Batch';
      
      // Determine dominant question type in exam
      const questions = result.exam.questions || [];
      const questionTypes = questions.map(q => q.type || 'multiple-choice');
      const typeCount = {};
      questionTypes.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      
      const dominantType = Object.keys(typeCount).reduce((a, b) => 
        typeCount[a] > typeCount[b] ? a : b, 'multiple-choice'
      );
      
      const questionType = dominantType === 'multiple-choice' ? 'MCQ' :
                          dominantType === 'coding' ? 'Coding' :
                          dominantType === 'true-false' ? 'True/False' :
                          dominantType === 'essay' ? 'Essay' : 'Mixed';
      
      if (!batchData[batchCode]) {
        batchData[batchCode] = {};
        batchStats[batchCode] = {};
      }
      
      if (!batchData[batchCode][questionType]) {
        batchData[batchCode][questionType] = [];
        batchStats[batchCode][questionType] = {
          totalLearners: new Set(),
          totalSubmissions: 0,
          averageScore: 0,
          topScore: 0
        };
      }
      
      batchData[batchCode][questionType].push({
        id: result.id,
        studentName: result.student.name,
        examTitle: result.exam.title,
        questionType: questionType,
        score: result.score,
        percentage: result.percentage,
        submittedAt: result.submittedAt
      });
      
      // Update stats
      batchStats[batchCode][questionType].totalLearners.add(result.student.name);
      batchStats[batchCode][questionType].totalSubmissions++;
      batchStats[batchCode][questionType].topScore = Math.max(batchStats[batchCode][questionType].topScore, result.percentage);
    });

    // Sort each batch and question type by percentage (top to bottom) and calculate averages
    Object.keys(batchData).forEach(batch => {
      Object.keys(batchData[batch]).forEach(questionType => {
        batchData[batch][questionType].sort((a, b) => b.percentage - a.percentage);
        
        // Calculate average score
        const totalScore = batchData[batch][questionType].reduce((sum, result) => sum + result.percentage, 0);
        batchStats[batch][questionType].averageScore = Math.round(totalScore / batchData[batch][questionType].length);
        batchStats[batch][questionType].totalLearners = batchStats[batch][questionType].totalLearners.size;
      });
    });

    res.json({
      success: true,
      data: {
        batches: batchData,
        stats: batchStats
      }
    });
  } catch (error) {
    console.error('Get batch performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get my batch leaderboard (Learner only)
 */
const getMyBatchLeaderboard = async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // If user has no batch, show empty leaderboard
    if (!currentUser.batchCode) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'No batch assigned to user'
      });
    }

    // Get all results for users in the same batch
    const results = await Result.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'username', 'batchCode'],
          where: { 
            role: 'learner',
            batchCode: currentUser.batchCode,
            isApproved: true
          },
          required: true
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'type'],
          required: true
        }
      ],
      where: {
        percentage: { [Op.gte]: 0 } // Only include valid results
      },
      order: [['percentage', 'DESC'], ['submittedAt', 'ASC']]
    });

    console.log(`Found ${results.length} results for batch ${currentUser.batchCode}`);

    if (results.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'No exam results found for your batch'
      });
    }

    // Group by student and get their best performance
    const studentPerformance = {};
    
    results.forEach(result => {
      const studentId = result.student.id;
      const studentName = result.student.name;
      
      if (!studentPerformance[studentId] || result.percentage > studentPerformance[studentId].percentage) {
        studentPerformance[studentId] = {
          id: studentId,
          name: studentName,
          username: result.student.username,
          percentage: Math.round(result.percentage * 100) / 100, // Round to 2 decimal places
          score: result.score,
          examTitle: result.exam.title,
          examType: result.exam.type,
          submittedAt: result.submittedAt,
          isCurrentUser: studentId === currentUser.id
        };
      }
    });

    // Convert to array and sort by percentage (highest first)
    const leaderboard = Object.values(studentPerformance)
      .sort((a, b) => {
        if (b.percentage === a.percentage) {
          return new Date(a.submittedAt) - new Date(b.submittedAt); // Earlier submission wins tie
        }
        return b.percentage - a.percentage;
      })
      .map((student, index) => ({
        ...student,
        rank: index + 1
      }));

    console.log(`Leaderboard generated with ${leaderboard.length} students`);

    res.json({
      success: true,
      data: leaderboard,
      batchCode: currentUser.batchCode,
      totalStudents: leaderboard.length
    });
  } catch (error) {
    console.error('Get batch leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

module.exports = {
  getStudentResults,
  getAllResults,
  getAnalytics,
  gradeAnswer,
  getBatchPerformance,
  getMyBatchLeaderboard
};