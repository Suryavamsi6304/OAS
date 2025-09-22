const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { connectDB } = require('./config/database');
const { auth, adminOnly, mentorOrAdmin, learnerOnly } = require('./middleware/auth');
const { csrfProtection, getCSRFToken } = require('./middleware/csrf');
const streamingRoutes = require('./src/routes/streaming');

// Controllers
const authController = require('./controllers/authController');
const examController = require('./controllers/examController');
const resultController = require('./controllers/resultController');
const jobController = require('./controllers/jobController');
// const proctoringController = require('./controllers/proctoringController'); // Removed - only logs remain
const reAttemptController = require('./controllers/reAttemptController');
const notificationController = require('./controllers/notificationController');
const compilerRoutes = require('./routes/compiler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'https://monumental-kataifi-3b4c02.netlify.app'
];

// Add network IPs dynamically
const os = require('os');
const networkInterfaces = os.networkInterfaces();
console.log('🌐 Detected network interfaces:');
for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const iface of interfaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`   - ${interfaceName}: ${iface.address}`);
      allowedOrigins.push(`http://${iface.address}:3000`);
      allowedOrigins.push(`http://${iface.address}:3001`);
    }
  }
}

// Add wildcard for development
allowedOrigins.push('*');

console.log('🔒 Allowed CORS origins:', allowedOrigins);

// Add development origins if in development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'OAS Backend API is running!',
    version: '1.0.0',
    endpoints: {
      test: '/api/test',
      auth: '/api/auth/*',
      exams: '/api/exams/*'
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// Debug data endpoint
app.get('/api/debug/data', async (req, res) => {
  try {
    const { checkData } = require('./debug-data');
    const data = await checkData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});









// CSRF token endpoint
app.get('/api/csrf-token', auth, getCSRFToken);

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

// Debug endpoint for batch data
app.get('/api/debug/batch-data', auth, async (req, res) => {
  try {
    const { User, Result, Exam } = require('./models');
    
    const currentUser = await User.findByPk(req.user.id);
    const allUsers = await User.findAll({ 
      where: { role: 'learner' },
      attributes: ['id', 'name', 'batchCode', 'isApproved']
    });
    const allResults = await Result.findAll({
      include: [{ model: User, as: 'student' }, { model: Exam, as: 'exam' }]
    });
    
    res.json({
      success: true,
      data: {
        currentUser: { id: currentUser.id, name: currentUser.name, batchCode: currentUser.batchCode },
        totalUsers: allUsers.length,
        usersInSameBatch: allUsers.filter(u => u.batchCode === currentUser.batchCode).length,
        totalResults: allResults.length,
        resultsInSameBatch: allResults.filter(r => r.student?.batchCode === currentUser.batchCode).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
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





// Live streaming routes - Allow all authenticated users for now
app.use('/api/streaming', auth, streamingRoutes);

// Compiler routes
app.use('/api/compiler', compilerRoutes);

// Re-attempt routes
app.post('/api/re-attempt/request', auth, learnerOnly, reAttemptController.requestReAttempt);
app.get('/api/re-attempt/requests', auth, mentorOrAdmin, reAttemptController.getReAttemptRequests);
app.get('/api/re-attempt/my-requests', auth, learnerOnly, reAttemptController.getMyReAttemptRequests);
app.put('/api/re-attempt/requests/:id/review', auth, mentorOrAdmin, reAttemptController.reviewReAttemptRequest);

// Failed skill assessments for re-attempts
app.get('/api/results/failed-skill-assessments', auth, learnerOnly, async (req, res) => {
  try {
    const { Result, Exam } = require('./models');
    const { Op } = require('sequelize');
    
    const failedResults = await Result.findAll({
      where: {
        studentId: req.user.id,
        percentage: { [Op.lt]: 60 } // Failed if less than 60%
      },
      include: [{
        model: Exam,
        as: 'exam',
        where: { type: 'skill-assessment' },
        attributes: ['id', 'title', 'description', 'passingScore']
      }],
      order: [['submittedAt', 'DESC']]
    });
    
    res.json({ success: true, data: failedResults });
  } catch (error) {
    console.error('Failed skill assessments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notification routes
app.get('/api/notifications', auth, notificationController.getNotifications);
app.put('/api/notifications/:id/read', auth, notificationController.markAsRead);
app.get('/api/notifications/unread-count', auth, notificationController.getUnreadCount);

// Admin user management routes
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'name', 'role', 'batchCode', 'isApproved', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Add default isActive field since it doesn't exist in model
    const usersWithStatus = users.map(user => ({
      ...user.toJSON(),
      isActive: true // Default to active since we don't have this field yet
    }));
    
    res.json({ success: true, data: usersWithStatus });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending approvals
app.get('/api/admin/pending-approvals', auth, mentorOrAdmin, async (req, res) => {
  try {
    const User = require('./models/User');
    const pendingUsers = await User.findAll({
      where: { isApproved: false },
      attributes: ['id', 'username', 'email', 'name', 'role', 'batchCode', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: pendingUsers });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Approve user
app.put('/api/admin/approve-user/:id', auth, mentorOrAdmin, async (req, res) => {
  try {
    const User = require('./models/User');
    const userId = req.params.id;
    const { approved } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (approved) {
      await user.update({
        isApproved: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      });
      res.json({ success: true, message: 'User approved successfully' });
    } else {
      await user.destroy();
      res.json({ success: true, message: 'User registration rejected' });
    }
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create user
app.post('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const User = require('./models/User');
    const { username, email, password, name, role, batchCode } = req.body;
    
    const user = await User.create({
      username,
      email,
      password,
      name,
      role,
      batchCode
    });
    
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
app.put('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const User = require('./models/User');
    const { username, email, name, role, batchCode } = req.body;
    
    await User.update(
      { username, email, name, role, batchCode },
      { where: { id: req.params.id } }
    );
    
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { User } = require('./models');
    
    // Check if user exists
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
    }
    
    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/users/:id/status', auth, adminOnly, async (req, res) => {
  try {
    // For now, just return success since we don't have isActive field in model
    // In a real implementation, you'd add isActive field to User model
    res.json({ success: true, message: 'User status updated successfully (simulated)' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Batch management routes
app.post('/api/batches', auth, mentorOrAdmin, async (req, res) => {
  try {
    const Batch = require('./models/Batch');
    const { code, name, description } = req.body;
    
    const batch = await Batch.create({
      code,
      name,
      description,
      createdBy: req.user.id
    });
    
    res.json({ success: true, data: batch });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/batches', async (req, res) => {
  try {
    const Batch = require('./models/Batch');
    const User = require('./models/User');
    
    const batches = await Batch.findAll({
      where: { isActive: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: batches });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/batches/:id', auth, mentorOrAdmin, async (req, res) => {
  try {
    const Batch = require('./models/Batch');
    const { name, description, isActive } = req.body;
    
    await Batch.update(
      { name, description, isActive },
      { where: { id: req.params.id } }
    );
    
    res.json({ success: true, message: 'Batch updated successfully' });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/batches/:id', auth, mentorOrAdmin, async (req, res) => {
  try {
    const Batch = require('./models/Batch');
    await Batch.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Meeting routes (legacy support)
app.get('/api/batch-codes', auth, async (req, res) => {
  try {
    const Batch = require('./models/Batch');
    const batches = await Batch.findAll({
      where: { isActive: true },
      attributes: ['code']
    });
    const batchCodes = batches.map(b => b.code);
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



// Single Socket.IO setup with proper error handling
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Make io available globally
app.set('io', io);

// Initialize streaming functionality
const activeStreams = new Map();
const meetingRooms = new Map();
const userRooms = new Map();

// Store streaming socket reference
app.set('streamingSocket', {
  getActiveStreams: () => {
    const streams = [];
    for (const [sessionId, stream] of activeStreams.entries()) {
      const duration = Math.floor((Date.now() - new Date(stream.startTime).getTime()) / 1000);
      streams.push({
        sessionId,
        studentId: stream.studentId,
        studentName: stream.studentName || `Student ${stream.studentId}`,
        examId: stream.examId,
        examTitle: stream.examTitle || `Exam ${stream.examId}`,
        startTime: stream.startTime,
        mentorCount: stream.mentorCount || 0,
        violations: stream.violations || 0,
        riskScore: stream.riskScore || 0,
        duration,
        status: 'active',
        isActive: true
      });
    }
    return streams;
  },
  terminateStream: (sessionId) => {
    const stream = activeStreams.get(sessionId);
    if (stream) {
      io.emit('stream-terminated', {
        sessionId,
        reason: 'Terminated by mentor'
      });
      activeStreams.delete(sessionId);
      return true;
    }
    return false;
  }
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  // Handle user room joining for notifications
  socket.on('join-user-room', (data) => {
    const { userId, userType } = data;
    const roomName = `user_${userId}`;
    socket.join(roomName);
    userRooms.set(socket.id, { userId, userType, roomName });
    console.log(`User ${userId} (${userType}) joined room ${roomName}`);
  });
  
  // Streaming handlers
  socket.on('student-start-stream', (data) => {
    const { sessionId, studentId, studentName, examId, examTitle } = data;
    
    activeStreams.set(sessionId, {
      sessionId, 
      studentId, 
      studentName: studentName || `Student ${studentId}`,
      examId, 
      examTitle: examTitle || 'Live Exam',
      startTime: new Date(), 
      mentorCount: 0,
      violations: 0,
      riskScore: 0
    });
    
    console.log(`📺 Stream started: ${studentName || studentId} - ${examTitle || examId}`);
    
    socket.broadcast.emit('new-stream-started', {
      sessionId, 
      studentId, 
      studentName: studentName || `Student ${studentId}`,
      examId, 
      examTitle: examTitle || 'Live Exam',
      startTime: new Date()
    });
  });

  socket.on('video-frame', (data) => {
    socket.broadcast.emit('video-frame', data);
  });

  socket.on('student-end-stream', (data) => {
    activeStreams.delete(data.sessionId);
    io.emit('stream-ended', data);
  });

  socket.on('mentor-join-stream', (data) => {
    const stream = activeStreams.get(data.sessionId);
    if (stream) stream.mentorCount++;
  });
  
  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
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
  
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    
    // Clean up user rooms
    userRooms.delete(socket.id);
    
    // Clean up from all meeting rooms
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server initialized`);
  console.log(`📡 Server accessible at http://0.0.0.0:${PORT}`);
  
  // Show actual network IPs
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('🌐 Access from other devices:');
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   Frontend: http://${iface.address}:3000`);
        console.log(`   Backend:  http://${iface.address}:3001`);
      }
    }
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});