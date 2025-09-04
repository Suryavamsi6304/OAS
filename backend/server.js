const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { connectDB } = require('./config/database');
const { auth, adminOnly, mentorOrAdmin, learnerOnly } = require('./middleware/auth');
const StreamingSocket = require('./src/socket/streamingSocket');
const streamingRoutes = require('./src/routes/streaming');

// Controllers
const authController = require('./controllers/authController');
const examController = require('./controllers/examController');
const resultController = require('./controllers/resultController');
const jobController = require('./controllers/jobController');
const proctoringController = require('./controllers/proctoringController');
const reAttemptController = require('./controllers/reAttemptController');
const notificationController = require('./controllers/notificationController');
const compilerRoutes = require('./routes/compiler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const streamingSocket = new StreamingSocket(server);
app.set('streamingSocket', streamingSocket);

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', auth, authController.verifyToken);

// Exam routes (includes practice tests and skill assessments)
app.post('/api/exams', auth, adminOnly, examController.createExam);
app.get('/api/exams', auth, examController.getExams);
app.get('/api/exams/:id', auth, examController.getExamById);
app.put('/api/exams/:id', auth, adminOnly, examController.updateExam);
app.delete('/api/exams/:id', auth, mentorOrAdmin, examController.deleteExam);
app.post('/api/exams/submit', auth, examController.submitExam);

// Result routes
app.get('/api/results/student', auth, resultController.getStudentResults);
app.get('/api/results/all', auth, mentorOrAdmin, resultController.getAllResults);
app.get('/api/results/batch-performance', auth, mentorOrAdmin, resultController.getBatchPerformance);
app.get('/api/results/my-batch-leaderboard', auth, resultController.getMyBatchLeaderboard);
app.put('/api/results/:id/grade', auth, mentorOrAdmin, resultController.gradeAnswer);
app.get('/api/analytics', auth, adminOnly, resultController.getAnalytics);

// Job routes
app.post('/api/jobs', auth, adminOnly, jobController.createJob);
app.get('/api/jobs', auth, jobController.getJobs);
app.post('/api/jobs/apply', auth, learnerOnly, jobController.applyForJob);
app.get('/api/applications', auth, jobController.getApplications);
app.put('/api/applications/:id', auth, mentorOrAdmin, jobController.updateApplication);

// Practice Tests routes
app.post('/api/practice-tests', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { Exam } = require('./models');
    const practiceTest = await Exam.create({
      ...req.body,
      createdBy: req.user.id,
      type: 'practice'
    });
    res.json({ success: true, data: practiceTest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get('/api/practice-tests', auth, async (req, res) => {
  try {
    const { Exam } = require('./models');
    let whereClause = { isActive: true, type: 'practice' };
    
    // Filter by batch for learners
    if (req.user.role === 'learner' && req.user.batchCode) {
      whereClause.batchCode = req.user.batchCode;
    }
    
    const tests = await Exam.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Skill Assessments routes
app.post('/api/skill-assessments', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { Exam } = require('./models');
    const assessment = await Exam.create({
      ...req.body,
      createdBy: req.user.id,
      type: 'skill-assessment'
    });
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get('/api/skill-assessments', auth, async (req, res) => {
  try {
    const { Exam } = require('./models');
    let whereClause = { isActive: true, type: 'skill-assessment' };
    
    // Filter by batch for learners
    if (req.user.role === 'learner' && req.user.batchCode) {
      whereClause.batchCode = req.user.batchCode;
    }
    
    const assessments = await Exam.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Proctoring routes
app.post('/api/proctoring/start', auth, proctoringController.startSession);
app.post('/api/proctoring/:sessionId/violation', auth, proctoringController.reportViolation);
app.post('/api/proctoring/log-violation', auth, async (req, res) => {
  try {
    const { ProctoringLog } = require('./models');
    const { sessionId, violationType, severity, details, riskScore } = req.body;
    
    const log = await ProctoringLog.create({
      sessionId,
      studentId: req.user.id,
      examId: req.body.examId,
      violationType,
      severity,
      details,
      riskScore
    });
    
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to log violation' });
  }
});
app.put('/api/proctoring/:sessionId/behavior', auth, proctoringController.updateBehavior);
app.post('/api/proctoring/:sessionId/end', auth, proctoringController.endSession);
app.get('/api/proctoring/sessions', auth, mentorOrAdmin, proctoringController.getSessions);

// Proctoring logs endpoint
app.get('/api/proctoring/logs', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { ProctoringLog, User, Exam } = require('./models');
    const { filter = 'all' } = req.query;
    
    let whereClause = {};
    if (filter === 'flagged') whereClause.status = 'flagged';
    if (filter === 'violations') whereClause.severity = ['high', 'critical'];
    
    const logs = await ProctoringLog.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['name'] },
        { model: Exam, attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// Active sessions endpoint
app.get('/api/proctoring/active-sessions', auth, mentorOrAdmin, async (req, res) => {
  try {
    const mockSessions = [
      {
        sessionId: 'session_' + Date.now(),
        studentName: 'Jane Smith',
        examTitle: 'React Development',
        riskScore: 45,
        violations: 1,
        duration: 900,
        lastViolation: 'Multiple faces detected'
      }
    ];
    res.json({ success: true, data: mockSessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active sessions' });
  }
});

// Flag student endpoint
app.post('/api/proctoring/:sessionId/flag', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    console.log(`Flagged session ${sessionId}: ${reason}`);
    res.json({ success: true, message: 'Student flagged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to flag student' });
  }
});

// Terminate session endpoint
app.post('/api/proctoring/:sessionId/terminate', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Terminated session ${sessionId}`);
    res.json({ success: true, message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to terminate session' });
  }
});

// Live streaming routes
app.use('/api/streaming', auth, mentorOrAdmin, streamingRoutes);

// Compiler routes
app.use('/api/compiler', compilerRoutes);

// Re-attempt routes
app.post('/api/re-attempt/request', auth, learnerOnly, reAttemptController.requestReAttempt);
app.get('/api/re-attempt/requests', auth, mentorOrAdmin, reAttemptController.getReAttemptRequests);
app.get('/api/re-attempt/my-requests', auth, learnerOnly, reAttemptController.getMyReAttemptRequests);
app.put('/api/re-attempt/requests/:id/review', auth, mentorOrAdmin, reAttemptController.reviewReAttemptRequest);

// Notification routes
app.get('/api/notifications', auth, notificationController.getNotifications);
app.put('/api/notifications/:id/read', auth, notificationController.markAsRead);
app.get('/api/notifications/unread-count', auth, notificationController.getUnreadCount);

// Meeting routes
app.get('/api/batches', auth, async (req, res) => {
  try {
    const { User } = require('./models');
    const batches = await User.findAll({
      where: { role: 'learner', batchCode: { [require('sequelize').Op.ne]: null } },
      attributes: ['batchCode'],
      group: ['batchCode']
    });
    const batchCodes = batches.map(b => b.batchCode).filter(Boolean);
    res.json({ success: true, data: batchCodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Store active meetings in memory (in production, use database)
let activeMeetings = {};

app.post('/api/meetings/invite', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { title, batches, meetingId } = req.body;
    const mentorName = req.user.name || req.user.username;
    
    // Store meeting for each batch
    batches.forEach(batch => {
      activeMeetings[batch] = {
        title,
        batches,
        meetingId,
        mentorName,
        startTime: new Date()
      };
    });
    
    // Notify all learners in the batches via Socket.IO
    const socketIO = req.app.get('io');
    if (socketIO) {
      batches.forEach(batch => {
        socketIO.emit('meeting-started', {
          batch,
          title,
          meetingId,
          mentorName,
          message: `${mentorName} has started a meeting: ${title}`
        });
      });
    }
    
    res.json({ 
      success: true, 
      message: `Meeting started and notifications sent to batches: ${batches.join(', ')}`,
      meetingId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/meetings/invites/:batchCode', auth, async (req, res) => {
  try {
    const { batchCode } = req.params;
    const meeting = activeMeetings[batchCode];
    
    if (meeting) {
      res.json({ success: true, data: meeting });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/meetings/end', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { meetingId, batches } = req.body;
    
    // Remove meeting from active meetings
    batches.forEach(batch => {
      delete activeMeetings[batch];
    });
    
    // Notify all learners in the batches via Socket.IO
    const socketIO = req.app.get('io');
    if (socketIO) {
      batches.forEach(batch => {
        socketIO.emit('meeting-ended', {
          batch,
          meetingId
        });
      });
    }
    
    res.json({ 
      success: true, 
      message: `Meeting ended for batches: ${batches.join(', ')}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Profile routes
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { User } = require('./models');
    const { name, batchCode } = req.body;
    
    await User.update(
      { name, batchCode },
      { where: { id: req.user.id } }
    );
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed data route (development only)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/seed', async (req, res) => {
    try {
      const { User, Exam, JobPosting } = require('./models');
      
      // Create admin user
      const [admin] = await User.findOrCreate({
        where: { username: 'admin' },
        defaults: {
          username: 'admin',
          email: 'admin@test.com',
          password: 'password',
          name: 'Admin User',
          role: 'admin'
        }
      });

      // Create mentor user
      const [mentor] = await User.findOrCreate({
        where: { username: 'mentor' },
        defaults: {
          username: 'mentor',
          email: 'mentor@test.com',
          password: 'password',
          name: 'Mentor User',
          role: 'mentor'
        }
      });

      // Create learner users
      const [learner1] = await User.findOrCreate({
        where: { username: 'learner1' },
        defaults: {
          username: 'learner1',
          email: 'learner1@test.com',
          password: 'password',
          name: 'Alice Johnson',
          role: 'learner',
          batchCode: 'BATCH001'
        }
      });

      const [learner2] = await User.findOrCreate({
        where: { username: 'learner2' },
        defaults: {
          username: 'learner2',
          email: 'learner2@test.com',
          password: 'password',
          name: 'Bob Smith',
          role: 'learner',
          batchCode: 'BATCH001'
        }
      });

      const [learner3] = await User.findOrCreate({
        where: { username: 'learner3' },
        defaults: {
          username: 'learner3',
          email: 'learner3@test.com',
          password: 'password',
          name: 'Carol Davis',
          role: 'learner',
          batchCode: 'BATCH002'
        }
      });

      // Create sample exam
      const [sampleExam] = await Exam.findOrCreate({
        where: { title: 'Sample Quiz' },
        defaults: {
          title: 'Sample Quiz',
          description: 'A sample quiz for testing',
          duration: 30,
          questions: [
            {
              _id: '1',
              type: 'multiple-choice',
              question: 'What is 2 + 2?',
              options: [
                { _id: 'a', text: '3', isCorrect: false },
                { _id: 'b', text: '4', isCorrect: true },
                { _id: 'c', text: '5', isCorrect: false }
              ],
              points: 1
            },
            {
              _id: '2',
              type: 'true-false',
              question: 'The sky is blue.',
              correctAnswer: 'true',
              points: 1
            }
          ],
          createdBy: admin.id,
          isActive: true,
          batchCode: 'BATCH001'
        }
      });

      // Create sample job posting
      const [sampleJob] = await JobPosting.findOrCreate({
        where: { title: 'Software Developer' },
        defaults: {
          title: 'Software Developer',
          description: 'We are looking for a skilled software developer to join our team.',
          requirements: 'Bachelor degree in Computer Science, 2+ years experience',
          location: 'Remote',
          salary: '$60,000 - $80,000',
          department: 'Engineering',
          createdBy: admin.id,
          status: 'active'
        }
      });

      res.json({
        success: true,
        message: 'Seed data created',
        data: { admin, mentor, learner1, learner2, learner3, sampleExam, sampleJob }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
}

// Meeting Socket.IO handlers
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io available globally for meeting notifications
app.set('io', io);

const meetingRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-meeting', (data) => {
    const { meetingId, userId } = data;
    socket.join(meetingId);
    
    if (!meetingRooms.has(meetingId)) {
      meetingRooms.set(meetingId, new Set());
    }
    
    const room = meetingRooms.get(meetingId);
    const user = { id: socket.id, userId, name: `User ${room.size + 1}` };
    room.add(user);
    
    // Notify others in the room
    socket.to(meetingId).emit('user-joined', { user });
    
    console.log(`User ${socket.id} joined meeting ${meetingId}`);
  });
  
  socket.on('offer', (data) => {
    socket.to(data.meetingId).emit('offer', {
      offer: data.offer,
      userId: socket.id,
      targetUserId: data.targetUserId
    });
  });
  
  socket.on('answer', (data) => {
    socket.to(data.meetingId).emit('answer', {
      answer: data.answer,
      userId: socket.id,
      targetUserId: data.targetUserId
    });
  });
  
  socket.on('ice-candidate', (data) => {
    socket.to(data.meetingId).emit('ice-candidate', {
      candidate: data.candidate,
      userId: socket.id,
      targetUserId: data.targetUserId
    });
  });
  
  socket.on('chat-message', (data) => {
    socket.to(data.meetingId).emit('chat-message', {
      sender: data.sender,
      message: data.message,
      userId: socket.id
    });
  });
  
  socket.on('toggle-audio', (data) => {
    socket.to(data.meetingId).emit('user-toggle-audio', {
      userId: socket.id,
      isAudioOn: data.isAudioOn
    });
  });
  
  socket.on('toggle-video', (data) => {
    socket.to(data.meetingId).emit('user-toggle-video', {
      userId: socket.id,
      isVideoOn: data.isVideoOn
    });
  });
  
  socket.on('leave-meeting', (data) => {
    socket.to(data.meetingId).emit('user-left', {
      userId: socket.id
    });
    socket.leave(data.meetingId);
    
    // Clean up room
    const room = meetingRooms.get(data.meetingId);
    if (room) {
      room.forEach(user => {
        if (user.id === socket.id) {
          room.delete(user);
        }
      });
      if (room.size === 0) {
        meetingRooms.delete(data.meetingId);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up from all rooms
    meetingRooms.forEach((room, meetingId) => {
      room.forEach(user => {
        if (user.id === socket.id) {
          room.delete(user);
          socket.to(meetingId).emit('user-left', {
            userId: socket.id
          });
        }
      });
      if (room.size === 0) {
        meetingRooms.delete(meetingId);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server initialized for meetings`);
});