const express = require('express');
const router = express.Router();

router.get('/active-streams', (req, res) => {
  const streams = req.app.get('streamingSocket')?.getActiveStreams() || [];
  
  // Add mock data if no real streams
  if (streams.length === 0) {
    const mockStreams = [
      {
        sessionId: 'mock_session_1',
        studentId: 1,
        studentName: 'Alice Johnson',
        examTitle: 'React Development Assessment',
        examId: 1,
        startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        riskScore: 25,
        violations: 1,
        duration: 900, // 15 minutes
        status: 'active',
        lastViolation: 'Multiple faces detected'
      },
      {
        sessionId: 'mock_session_2',
        studentId: 2,
        studentName: 'Bob Smith',
        examTitle: 'JavaScript Fundamentals',
        examId: 2,
        startTime: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        riskScore: 5,
        violations: 0,
        duration: 480, // 8 minutes
        status: 'active'
      },
      {
        sessionId: 'mock_session_3',
        studentId: 3,
        studentName: 'Carol Davis',
        examTitle: 'Python Data Structures',
        examId: 3,
        startTime: new Date(Date.now() - 22 * 60 * 1000), // 22 minutes ago
        riskScore: 60,
        violations: 3,
        duration: 1320, // 22 minutes
        status: 'active',
        lastViolation: 'Tab switching detected'
      }
    ];
    return res.json({ success: true, data: mockStreams });
  }
  
  res.json({ success: true, data: streams });
});

router.post('/:sessionId/flag', (req, res) => {
  const { sessionId } = req.params;
  const { reason } = req.body;
  console.log(`Student flagged - Session: ${sessionId}, Reason: ${reason}`);
  res.json({ success: true, message: 'Student flagged successfully' });
});

router.post('/:sessionId/terminate', (req, res) => {
  const { sessionId } = req.params;
  const streamingSocket = req.app.get('streamingSocket');
  if (streamingSocket) {
    streamingSocket.terminateStream?.(sessionId);
  }
  res.json({ success: true, message: 'Session terminated' });
});

module.exports = router;