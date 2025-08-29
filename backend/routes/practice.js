const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get practice questions by level
router.get('/level/:level', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    
    if (![1, 2, 3].includes(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    const difficulty = level === 1 ? 'easy' : level === 2 ? 'medium' : 'hard';
    
    const questions = await db.query(
      `SELECT id, question_text, question_type, options, marks, difficulty
       FROM question_bank 
       WHERE difficulty = $1 
       ORDER BY RANDOM() 
       LIMIT 10`,
      [difficulty]
    );

    res.json(questions.rows);
  } catch (error) {
    console.error('Get practice questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit practice session
router.post('/submit', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { level, answers, timeTaken } = req.body;
    
    // Get correct answers
    const questionIds = Object.keys(answers);
    const questions = await db.query(
      `SELECT id, correct_answer FROM question_bank WHERE id = ANY($1)`,
      [questionIds]
    );

    let correctCount = 0;
    questions.rows.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    // Save practice session
    await db.query(
      `INSERT INTO practice_sessions (student_id, level, questions_attempted, correct_answers, session_time, completed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, level, questionIds.length, correctCount, timeTaken, true]
    );

    res.json({
      questionsAttempted: questionIds.length,
      correctAnswers: correctCount,
      percentage: ((correctCount / questionIds.length) * 100).toFixed(2)
    });
  } catch (error) {
    console.error('Submit practice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;