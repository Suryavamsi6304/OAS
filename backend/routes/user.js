const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    let dashboardData = {};

    if (req.user.role === 'student') {
      // Today's tests
      const todayTests = await db.query(
        `SELECT a.* FROM assessments a
         WHERE a.status = 'published' 
         AND DATE(a.start_time) = CURRENT_DATE
         AND NOT EXISTS (SELECT 1 FROM results r WHERE r.assessment_id = a.id AND r.student_id = $1)`,
        [req.user.id]
      );

      // Recently attempted tests
      const recentTests = await db.query(
        `SELECT r.*, a.title FROM results r
         JOIN assessments a ON r.assessment_id = a.id
         WHERE r.student_id = $1
         ORDER BY r.submitted_at DESC LIMIT 10`,
        [req.user.id]
      );

      // Student statistics
      const stats = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM assessments WHERE status = $1', ['published']),
        db.query('SELECT COUNT(*) as count FROM results r JOIN users u ON r.student_id = u.id WHERE u.role = $1', ['student']),
        db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']),
        db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['teacher'])
      ]);

      console.log('Student dashboard stats:', {
        testsDesigned: stats[0].rows[0].count,
        testsConducted: stats[1].rows[0].count,
        testTakers: stats[2].rows[0].count,
        testDesigners: stats[3].rows[0].count
      });

      dashboardData = {
        todayTests: todayTests.rows,
        recentTests: recentTests.rows,
        stats: {
          testsDesigned: parseInt(stats[0].rows[0].count),
          testsConducted: parseInt(stats[1].rows[0].count),
          testTakers: parseInt(stats[2].rows[0].count),
          testDesigners: parseInt(stats[3].rows[0].count)
        }
      };
    } else if (req.user.role === 'teacher') {
      // Teacher's assessments
      const assessments = await db.query(
        'SELECT COUNT(*) as count FROM assessments WHERE creator_id = $1',
        [req.user.id]
      );

      // Students count
      const students = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['student']
      );

      dashboardData = {
        stats: {
          testsDesigned: assessments.rows[0].count,
          totalStudents: students.rows[0].count
        }
      };
    } else if (req.user.role === 'admin') {
      // Admin dashboard stats
      const stats = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM assessments'),
        db.query('SELECT COUNT(*) as count FROM results'),
        db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']),
        db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['teacher'])
      ]);

      dashboardData = {
        stats: {
          testsDesigned: stats[0].rows[0].count,
          testsConducted: stats[1].rows[0].count,
          testTakers: stats[2].rows[0].count,
          testDesigners: stats[3].rows[0].count
        }
      };
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;