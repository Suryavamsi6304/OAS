const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeForLog } = require('../utils/sanitize');
const { 
  startSession, 
  reportViolation, 
  updateBehavior, 
  endSession, 
  getSessions,
  sendMentorRequest,
  checkMentorResponse,
  handleMentorRequest
} = require('../controllers/proctoringController');

const router = express.Router();

// Start proctoring session
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const studentId = req.user.userId;
    const sessionToken = uuidv4();

    const result = await db.query(
      'INSERT INTO proctoring_sessions (student_id, assessment_id, session_token, status, total_violations, risk_score) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [studentId, assessmentId, sessionToken, 'active', 0, 0]
    );

    res.json({ session: result.rows[0] });
  } catch (error) {
    console.error('Start proctoring error:', error);
    res.status(500).json({ error: 'Failed to start proctoring session' });
  }
});

// Log violation
router.post('/violation', authenticateToken, async (req, res) => {
  try {
    const { sessionId, violationType, severity, description, metadata } = req.body;

    const violationResult = await db.query(
      'INSERT INTO proctoring_violations (session_id, violation_type, severity, description, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [sessionId, violationType, severity, description, JSON.stringify(metadata)]
    );
    
    console.log('Violation logged successfully');

    // Get current violation count
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM proctoring_violations WHERE session_id = $1',
      [sessionId]
    );
    
    const violationCount = parseInt(countResult.rows[0].count);
    const shouldBlock = violationCount >= 5;
    
    await db.query(
      'UPDATE proctoring_sessions SET total_violations = $1, risk_score = risk_score + $2, status = $3 WHERE id = $4',
      [
        violationCount,
        severity === 'critical' ? 10 : severity === 'high' ? 5 : severity === 'medium' ? 3 : 1,
        shouldBlock ? 'blocked' : 'active',
        sessionId
      ]
    );

    res.json({ 
      success: true, 
      violationCount,
      shouldBlock
    });
  } catch (error) {
    console.error('Log violation error:', error);
    res.status(500).json({ error: 'Failed to log violation' });
  }
});

// End proctoring session
router.post('/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Only end if not blocked
    const sessionResult = await db.query(
      'SELECT status FROM proctoring_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length > 0 && sessionResult.rows[0].status !== 'blocked') {
      await db.query(
        'UPDATE proctoring_sessions SET end_time = CURRENT_TIMESTAMP, status = $1 WHERE id = $2',
        ['completed', sessionId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('End proctoring error:', error);
    res.status(500).json({ error: 'Failed to end proctoring session' });
  }
});

// Get proctoring settings
router.get('/settings/:assessmentId', authenticateToken, async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const result = await db.query(
      'SELECT * FROM assessment_proctoring_settings WHERE assessment_id = $1',
      [assessmentId]
    );

    if (result.rows.length === 0) {
      return res.json({
        proctoring_enabled: true,
        camera_required: true,
        microphone_required: true,
        screen_recording: true,
        face_detection: true,
        multiple_person_detection: true,
        tab_switching_detection: true,
        copy_paste_prevention: true,
        right_click_disabled: true,
        fullscreen_required: true,
        violation_threshold: 5,
        auto_submit_on_violation: false,
        block_on_violations: true
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get proctoring settings error:', error);
    res.status(500).json({ error: 'Failed to get proctoring settings' });
  }
});

// Get proctoring logs for teacher's assessments
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { assessmentId } = req.query;

    console.log('Getting proctoring logs for teacher');

    // First get teacher's assessments
    let assessmentQuery = 'SELECT id, title FROM assessments WHERE creator_id = $1';
    const assessmentParams = [teacherId];
    
    if (assessmentId) {
      assessmentQuery += ' AND id = $2';
      assessmentParams.push(assessmentId);
    }
    
    const assessments = await db.query(assessmentQuery, assessmentParams);
    console.log('Found assessments:', assessments.rows.length);
    
    if (assessments.rows.length === 0) {
      console.log('No assessments found for teacher');
      return res.json([]);
    }
    
    const assessmentIds = assessments.rows.map(a => a.id);
    const assessmentTitles = {};
    assessments.rows.forEach(a => {
      assessmentTitles[a.id] = a.title;
    });
    
    // Get proctoring sessions for these assessments
    const placeholders = assessmentIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT 
        ps.id as session_id,
        ps.assessment_id,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown Student') as student_name,
        COALESCE(u.email, 'unknown@email.com') as student_email,
        ps.start_time,
        ps.end_time,
        ps.status,
        COALESCE(ps.total_violations, 0) as total_violations,
        COALESCE(ps.risk_score, 0) as risk_score,
        pv.violation_type,
        pv.severity,
        pv.description,
        pv.timestamp as violation_time
      FROM proctoring_sessions ps
      LEFT JOIN users u ON ps.student_id = u.id
      LEFT JOIN proctoring_violations pv ON ps.id = pv.session_id
      WHERE ps.assessment_id IN (${placeholders})
      ORDER BY ps.start_time DESC, pv.timestamp DESC
    `;

    console.log('Executing proctoring logs query');
    const result = await db.query(query, assessmentIds);
    console.log('Query result rows:', result.rows.length);
    
    // Add assessment titles to results
    const logsWithTitles = result.rows.map(row => ({
      ...row,
      assessment_title: assessmentTitles[row.assessment_id] || 'Unknown Assessment'
    }));
    
    console.log('Returning logs:', logsWithTitles.length);
    res.json(logsWithTitles);
  } catch (error) {
    console.error('Get proctoring logs error:', error);
    res.status(500).json({ error: 'Failed to get proctoring logs', details: error.message });
  }
});

// Send mentor request
router.post('/mentor-request', authenticateToken, async (req, res) => {
  try {
    const { sessionId, reason, violations, riskScore } = req.body;
    
    await db.query(
      'UPDATE proctoring_sessions SET status = $1, mentor_request = $2 WHERE id = $3',
      ['blocked', JSON.stringify({
        reason,
        violations,
        riskScore,
        timestamp: new Date(),
        status: 'pending'
      }), sessionId]
    );

    res.json({ success: true, message: 'Mentor request sent successfully' });
  } catch (error) {
    console.error('Send mentor request error:', error);
    res.status(500).json({ error: 'Failed to send mentor request' });
  }
});

// Check mentor response
router.get('/mentor-response/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await db.query(
      'SELECT mentor_request FROM proctoring_sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const mentorRequest = result.rows[0].mentor_request;
    if (!mentorRequest) {
      return res.json({ approved: false, rejected: false, pending: false });
    }

    const request = typeof mentorRequest === 'string' ? JSON.parse(mentorRequest) : mentorRequest;
    
    res.json({
      approved: request.status === 'approved',
      rejected: request.status === 'rejected',
      pending: request.status === 'pending'
    });
  } catch (error) {
    console.error('Check mentor response error:', error);
    res.status(500).json({ error: 'Failed to check mentor response' });
  }
});

// Handle mentor request (approve/reject)
router.post('/mentor-request/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, comments } = req.body;
    
    const sessionResult = await db.query(
      'SELECT mentor_request FROM proctoring_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const mentorRequest = sessionResult.rows[0].mentor_request;
    const request = typeof mentorRequest === 'string' ? JSON.parse(mentorRequest) : mentorRequest;
    
    const updatedRequest = {
      ...request,
      status: action === 'approve' ? 'approved' : 'rejected',
      mentorComments: comments,
      responseTime: new Date()
    };

    await db.query(
      'UPDATE proctoring_sessions SET mentor_request = $1, status = $2 WHERE id = $3',
      [JSON.stringify(updatedRequest), action === 'approve' ? 'active' : 'terminated', sessionId]
    );

    res.json({ success: true, message: `Request ${action}d successfully` });
  } catch (error) {
    console.error('Handle mentor request error:', error);
    res.status(500).json({ error: 'Failed to handle mentor request' });
  }
});

// Test endpoint to verify routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Proctoring routes are working!' });
});

// Debug endpoint to check database tables
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    const sessions = await db.query('SELECT COUNT(*) FROM proctoring_sessions');
    const violations = await db.query('SELECT COUNT(*) FROM proctoring_violations');
    const settings = await db.query('SELECT COUNT(*) FROM assessment_proctoring_settings');
    
    res.json({
      sessions: sessions.rows[0].count,
      violations: violations.rows[0].count,
      settings: settings.rows[0].count,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;