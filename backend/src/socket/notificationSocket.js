const { Server } = require('socket.io');

let io;

const initializeNotificationSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected for notifications:', socket.id);

    // Join user-specific room
    socket.on('join-user-room', (data) => {
      const { userId, userType } = data;
      const roomName = `${userType}-${userId}`;
      socket.join(roomName);
      console.log(`User ${userId} (${userType}) joined room: ${roomName}`);
    });

    // Handle new re-attempt request from learner
    socket.on('new-reattempt-request', (data) => {
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