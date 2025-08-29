const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, role, first_name, last_name, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user
router.post('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, hashedPassword, role, firstName, lastName]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'User created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics
router.get('/analytics', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      db.query('SELECT COUNT(*) as total_assessments FROM assessments'),
      db.query('SELECT COUNT(*) as total_results FROM results'),
      db.query('SELECT COUNT(*) as total_users FROM users'),
      db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role')
    ]);

    res.json({
      totalAssessments: stats[0].rows[0].total_assessments,
      totalResults: stats[1].rows[0].total_results,
      totalUsers: stats[2].rows[0].total_users,
      usersByRole: stats[3].rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;