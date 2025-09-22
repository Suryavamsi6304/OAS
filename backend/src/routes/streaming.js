const express = require('express');
const router = express.Router();

router.get('/active-streams', (req, res) => {
  const streams = req.app.get('streamingSocket')?.getActiveStreams() || [];
  

  
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
  if (streamingSocket && streamingSocket.terminateStream) {
    const terminated = streamingSocket.terminateStream(sessionId);
    if (terminated) {
      res.json({ success: true, message: 'Session terminated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Session not found' });
    }
  } else {
    res.status(500).json({ success: false, message: 'Streaming service unavailable' });
  }
});

module.exports = router;