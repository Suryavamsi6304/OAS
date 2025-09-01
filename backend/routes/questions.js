const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get questions for assessment (for test taking)
router.get('/assessment/:assessmentId', authenticateToken, async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;
    console.log('Getting questions for assessment ID:', assessmentId, 'requested by user:', req.user.id);
    
    const result = await db.query(
      'SELECT id, question_text, question_type, options, marks, order_number FROM questions WHERE assessment_id = $1 ORDER BY order_number',
      [assessmentId]
    );

    console.log('Found questions:', result.rows.length, 'for assessment:', assessmentId);
    res.json(result.rows);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;