const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeNotificationSocket = (server) => {
  const allowedOrigins = process.env.SOCKET_ORIGINS ? process.env.SOCKET_ORIGINS.split(',') : ['http://localhost:3000'];
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected for notifications:', socket.id);

    // Join user-specific room
    socket.on('join-user-room', (data) => {
      if (!socket.userId) return;
      
      const { userId, userType } = data;
      if (userId !== socket.userId || userType !== socket.userRole) {
        return socket.emit('error', 'Unauthorized');
      }
      
      const roomName = `${userType}-${userId}`;
      socket.join(roomName);
      console.log(`User ${userId} (${userType}) joined room: ${roomName}`);
    });

    // Handle new re-attempt request from learner
    socket.on('new-reattempt-request', (data) => {
      if (socket.userRole !== 'learner') {
        return socket.emit('error', 'Unauthorized');
      }
      
      console.log('New re-attempt request:', data);
      
      // Broadcast to all mentors
      socket.broadcast.to('mentor-room').emit('new-reattempt-request', {
        requestId: data.requestId,
        studentId: data.studentId,
        studentName: data.studentName,
        examId: data.examId,
        examTitle: data.examTitle,
        reason: data.reason,
        timestamp: new Date()
      });
    });

    // Handle re-attempt response from mentor
    socket.on('reattempt-response', (data) => {
      if (socket.userRole !== 'mentor' && socket.userRole !== 'admin') {
        return socket.emit('error', 'Unauthorized');
      }
      
      console.log('Re-attempt response:', data);
      
      // Send to specific student
      const studentRoom = `learner-${data.studentId}`;
      io.to(studentRoom).emit('reattempt-response', {
        examId: data.examId,
        examTitle: data.examTitle,
        status: data.status,
        comment: data.comment,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeNotificationSocket,
  getIO
};