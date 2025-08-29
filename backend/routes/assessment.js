const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all assessments for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;
    
    if (req.user.role === 'student') {
      query = `
        SELECT a.*, u.first_name, u.last_name,
               CASE WHEN r.id IS NOT NULL THEN true ELSE false END as attempted
        FROM assessments a
        JOIN users u ON a.creator_id = u.id
        LEFT JOIN results r ON a.id = r.assessment_id AND r.student_id = $1
        WHERE a.status = 'published' AND (a.start_time IS NULL OR a.start_time <= NOW())
        ORDER BY a.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'admin') {
      query = `
        SELECT a.*, u.first_name, u.last_name,
               (SELECT COUNT(*) FROM results r JOIN users us ON r.student_id = us.id 
                WHERE r.assessment_id = a.id AND us.role = 'student') as attempt_count
        FROM assessments a
        JOIN users u ON a.creator_id = u.id
        ORDER BY a.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT a.*, u.first_name, u.last_name,
               (SELECT COUNT(*) FROM results r JOIN users us ON r.student_id = us.id 
                WHERE r.assessment_id = a.id AND us.role = 'student') as attempt_count
        FROM assessments a
        JOIN users u ON a.creator_id = u.id
        WHERE a.creator_id = $1
        ORDER BY a.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assessment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assessmentId = req.params.id;
    
    const result = await db.query(
      'SELECT * FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const assessment = result.rows[0];

    // Check permissions
    if (req.user.role === 'student' && assessment.status !== 'published') {
      return res.status(403).json({ error: 'Assessment not available' });
    }

    if (req.user.role === 'teacher' && assessment.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Admin can access all assessments

    res.json(assessment);
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create assessment
router.post('/', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const schema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().allow(''),
      timeLimit: Joi.number().min(1).required(),
      totalMarks: Joi.number().min(1).required(),
      negativeMarking: Joi.boolean().default(false),
      negativeMarks: Joi.number().min(0).max(1).default(0),
      courseCode: Joi.string().allow(''),
      startTime: Joi.date().allow(null),
      endTime: Joi.date().allow(null),
      status: Joi.string().valid('draft', 'published', 'archived').default('published'),
      questions: Joi.array().items(Joi.object({
        questionText: Joi.string().required(),
        questionType: Joi.string().valid('mcq', 'true_false', 'short_answer', 'essay', 'fill_blank').required(),
        options: Joi.array().when('questionType', { is: 'mcq', then: Joi.required() }),
        correctAnswer: Joi.string().required(),
        marks: Joi.number().min(1).required(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium')
      })).min(1).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, timeLimit, totalMarks, negativeMarking, negativeMarks, courseCode, startTime, endTime, status, questions } = req.body;

    // Create assessment
    const assessmentResult = await db.query(
      `INSERT INTO assessments (title, description, creator_id, time_limit, total_marks, negative_marking, negative_marks, course_code, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [title, description, req.user.id, timeLimit, totalMarks, negativeMarking, negativeMarks, courseCode, startTime, endTime, status || 'published']
    );

    const assessmentId = assessmentResult.rows[0].id;

    // Add questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db.query(
        `INSERT INTO questions (assessment_id, question_text, question_type, options, correct_answer, marks, difficulty, order_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [assessmentId, q.questionText, q.questionType, JSON.stringify(q.options), q.correctAnswer, q.marks, q.difficulty, i + 1]
      );
    }

    res.status(201).json({ id: assessmentId, message: 'Assessment created successfully' });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update assessment
router.put('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const { title, description, timeLimit, totalMarks, negativeMarking, negativeMarks, courseCode, status } = req.body;

    // Check ownership for teachers
    if (req.user.role === 'teacher') {
      const ownerCheck = await db.query(
        'SELECT creator_id FROM assessments WHERE id = $1',
        [assessmentId]
      );
      
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await db.query(
      `UPDATE assessments SET title = $1, description = $2, time_limit = $3, total_marks = $4, 
       negative_marking = $5, negative_marks = $6, course_code = $7, status = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [title, description, timeLimit, totalMarks, negativeMarking, negativeMarks, courseCode, status || 'draft', assessmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish assessment
router.put('/:id/publish', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const assessmentId = req.params.id;

    if (req.user.role === 'teacher') {
      const ownerCheck = await db.query(
        'SELECT creator_id FROM assessments WHERE id = $1',
        [assessmentId]
      );
      
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await db.query(
      'UPDATE assessments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['published', assessmentId]
    );

    res.json({ message: 'Assessment published successfully' });
  } catch (error) {
    console.error('Publish assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete assessment
router.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const assessmentId = req.params.id;

    if (req.user.role === 'teacher') {
      const ownerCheck = await db.query(
        'SELECT creator_id FROM assessments WHERE id = $1',
        [assessmentId]
      );
      
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Delete questions first (foreign key constraint)
    await db.query('DELETE FROM questions WHERE assessment_id = $1', [assessmentId]);
    
    // Delete results
    await db.query('DELETE FROM results WHERE assessment_id = $1', [assessmentId]);
    
    // Delete assessment
    const result = await db.query('DELETE FROM assessments WHERE id = $1 RETURNING *', [assessmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;