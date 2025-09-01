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

// Delete user (deactivate)
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Attempting to deactivate user with ID:', userId);
    
    // First check if user exists and get their role
    const userCheck = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userCheck.rows[0].role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }
    
    // Deactivate user instead of deleting to avoid foreign key constraints
    const result = await db.query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [userId]
    );

    console.log('Deactivate result:', result.rowCount);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics
router.get('/analytics', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      db.query('SELECT COUNT(*) as total_assessments FROM assessments'),
      db.query('SELECT COUNT(*) as tests_conducted FROM results'),
      db.query('SELECT COUNT(*) as total_students FROM users WHERE role = $1', ['student']),
      db.query('SELECT COUNT(*) as total_teachers FROM users WHERE role = $1', ['teacher'])
    ]);

    res.json({
      totalAssessments: parseInt(stats[0].rows[0].total_assessments),
      testsConducted: parseInt(stats[1].rows[0].tests_conducted),
      totalStudents: parseInt(stats[2].rows[0].total_students),
      totalTeachers: parseInt(stats[3].rows[0].total_teachers)
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive reports
router.get('/reports', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const reports = await Promise.all([
      // Assessment performance
      db.query(`
        SELECT a.title, a.total_marks, COUNT(r.id) as attempts,
               AVG(r.percentage) as avg_percentage, MAX(r.percentage) as max_percentage,
               MIN(r.percentage) as min_percentage
        FROM assessments a
        LEFT JOIN results r ON a.id = r.assessment_id
        GROUP BY a.id, a.title, a.total_marks
        ORDER BY attempts DESC
      `),
      // User activity (only students for test taking)
      db.query(`
        SELECT 'student' as role, COUNT(r.id) as total_attempts,
               AVG(r.percentage) as avg_performance
        FROM results r
        JOIN users u ON r.student_id = u.id
        WHERE u.role = 'student'
      `),
      // Recent activity
      db.query(`
        SELECT r.submitted_at, u.first_name, u.last_name, a.title, r.percentage
        FROM results r
        JOIN users u ON r.student_id = u.id
        JOIN assessments a ON r.assessment_id = a.id
        WHERE u.role = 'student'
        ORDER BY r.submitted_at DESC
        LIMIT 10
      `),
      // Top performers
      db.query(`
        SELECT u.first_name, u.last_name, AVG(r.percentage) as avg_score,
               COUNT(r.id) as total_tests
        FROM users u
        JOIN results r ON u.id = r.student_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.first_name, u.last_name
        HAVING COUNT(r.id) > 0
        ORDER BY avg_score DESC
        LIMIT 10
      `),
      // Summary statistics
      db.query('SELECT COUNT(*) as total_assessments FROM assessments'),
      db.query('SELECT COUNT(*) as tests_conducted FROM results r JOIN users u ON r.student_id = u.id WHERE u.role = $1', ['student']),
      db.query('SELECT COUNT(*) as total_students FROM users WHERE role = $1', ['student']),
      db.query('SELECT COUNT(*) as total_teachers FROM users WHERE role = $1', ['teacher'])
    ]);

    res.json({
      assessmentPerformance: reports[0].rows,
      userActivity: reports[1].rows,
      recentActivity: reports[2].rows,
      topPerformers: reports[3].rows,
      summary: {
        totalAssessments: parseInt(reports[4].rows[0].total_assessments),
        testsConducted: parseInt(reports[5].rows[0].tests_conducted),
        totalStudents: parseInt(reports[6].rows[0].total_students),
        totalTeachers: parseInt(reports[7].rows[0].total_teachers)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system announcement
router.get('/announcement', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT message, type, is_active, created_at
      FROM system_announcements
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);
    res.json(result.rows[0] || null);
  } catch (error) {
    res.json(null);
  }
});

// Update system announcement
router.post('/announcement', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { message, type, isActive } = req.body;
    
    // Deactivate all existing announcements
    await db.query('UPDATE system_announcements SET is_active = false');
    
    if (message && isActive) {
      await db.query(
        'INSERT INTO system_announcements (message, type, is_active, created_by) VALUES ($1, $2, $3, $4)',
        [message, type || 'info', true, req.user.id]
      );
    }
    
    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;