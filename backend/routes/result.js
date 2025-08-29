const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Submit assessment
router.post('/submit/:assessmentId', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;
    const { answers, timeTaken } = req.body;

    // Check if already submitted
    const existingResult = await db.query(
      'SELECT id FROM results WHERE student_id = $1 AND assessment_id = $2',
      [req.user.id, assessmentId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Assessment already submitted' });
    }

    // Get assessment and questions
    const assessmentResult = await db.query(
      'SELECT * FROM assessments WHERE id = $1 AND status = $2',
      [assessmentId, 'published']
    );

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const assessment = assessmentResult.rows[0];
    
    const questionsResult = await db.query(
      'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY order_number',
      [assessmentId]
    );

    const questions = questionsResult.rows;

    // Calculate score
    let totalScore = 0;
    let correctAnswers = 0;

    questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer.toLowerCase() === question.correct_answer.toLowerCase()) {
        totalScore += question.marks;
        correctAnswers++;
      } else if (assessment.negative_marking && userAnswer) {
        totalScore -= (question.marks * assessment.negative_marks);
      }
    });

    const percentage = (totalScore / assessment.total_marks) * 100;

    // Save result
    const result = await db.query(
      `INSERT INTO results (student_id, assessment_id, answers, score, percentage, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, assessmentId, JSON.stringify(answers), totalScore, percentage, timeTaken]
    );

    res.json({
      resultId: result.rows[0].id,
      score: totalScore,
      totalMarks: assessment.total_marks,
      percentage: percentage.toFixed(2),
      correctAnswers,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific result by ID
router.get('/:resultId', authenticateToken, async (req, res) => {
  try {
    const resultId = req.params.resultId;

    const result = await db.query(
      `SELECT r.*, a.title, a.total_marks, a.time_limit, a.id as assessment_id
       FROM results r
       JOIN assessments a ON r.assessment_id = a.id
       WHERE r.id = $1`,
      [resultId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const resultData = result.rows[0];

    // Check permissions
    if (req.user.role === 'student' && req.user.id != resultData.student_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(resultData);
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student results
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Check permissions
    if (req.user.role === 'student' && req.user.id != studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `SELECT r.*, a.title, a.total_marks, a.time_limit
       FROM results r
       JOIN assessments a ON r.assessment_id = a.id
       WHERE r.student_id = $1
       ORDER BY r.submitted_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assessment results (for teachers)
router.get('/assessment/:assessmentId', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;

    const result = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email
       FROM results r
       JOIN users u ON r.student_id = u.id
       WHERE r.assessment_id = $1
       ORDER BY r.score DESC`,
      [assessmentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get assessment results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;