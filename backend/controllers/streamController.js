const { Server } = require('socket.io');

let io;
const activeStreams = new Map(); // sessionId -> { studentSocket, mentorSockets[], studentId, examId, startTime }

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Student starts streaming
    socket.on('student-start-stream', (data) => {
      const { sessionId, studentId, studentName, examId, examTitle } = data;
      
      activeStreams.set(sessionId, {
        studentSocket: socket.id,
        mentorSockets: [],
        studentId,
        studentName: studentName || `Student ${studentId}`,
        examId,
        examTitle: examTitle || `Exam ${examId}`,
        startTime: new Date(),
        violations: 0,
        riskScore: 0
      });
      
      socket.join(`stream-${sessionId}`);
      console.log(`${studentName || `Student ${studentId}`} started streaming for session ${sessionId}`);
      
      // Notify all mentors that a new stream is available
      socket.broadcast.emit('new-stream-started', {
        sessionId,
        studentId,
        studentName: studentName || `Student ${studentId}`,
        examId,
        examTitle: examTitle || `Exam ${examId}`,
        startTime: new Date()
      });
    });

    // Mentor joins to watch stream
    socket.on('mentor-join-stream', (data) => {
      const { sessionId, mentorId } = data;
      
      if (activeStreams.has(sessionId)) {
        const stream = activeStreams.get(sessionId);
        if (!stream.mentorSockets.includes(socket.id)) {
          stream.mentorSockets.push(socket.id);
          activeStreams.set(sessionId, stream);
        }
        
        socket.join(`stream-${sessionId}`);
        console.log(`Mentor ${mentorId} joined stream ${sessionId}`);
        
        // Notify student that mentor joined
        io.to(stream.studentSocket).emit('mentor-joined', { mentorId });
      }
    });

    // Mentor leaves stream
    socket.on('mentor-leave-stream', (data) => {
      const { sessionId } = data;
      
      if (activeStreams.has(sessionId)) {
        const stream = activeStreams.get(sessionId);
        stream.mentorSockets = stream.mentorSockets.filter(id => id !== socket.id);
        activeStreams.set(sessionId, stream);
        
        socket.leave(`stream-${sessionId}`);
        
        // Notify student that mentor left
        io.to(stream.studentSocket).emit('mentor-left');
      }
    });

    // Handle video frames from student
    socket.on('video-frame', (data) => {
      const { sessionId, frameData, timestamp } = data;
      
      // Update stream activity
      if (activeStreams.has(sessionId)) {
        const stream = activeStreams.get(sessionId);
        stream.lastActivity = new Date();
        activeStreams.set(sessionId, stream);
      }
      
      // Broadcast frame to all connected clients (mentors)
      socket.broadcast.emit('video-frame', {
        sessionId,
        frameData,
        timestamp
      });
    });

    // Handle proctoring violations
    socket.on('proctoring-violation', (data) => {
      const { sessionId, violationType, severity } = data;
      
      if (activeStreams.has(sessionId)) {
        const stream = activeStreams.get(sessionId);
        stream.violations += 1;
        stream.riskScore = Math.min(100, stream.riskScore + (severity || 10));
        stream.lastViolation = violationType;
        activeStreams.set(sessionId, stream);
        
        // Notify mentors about the violation
        socket.to(`stream-${sessionId}`).emit('proctoring-violation', {
          sessionId,
          violationType,
          severity,
          timestamp: new Date()
        });
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(`stream-${data.sessionId}`).emit('offer', data);
    });

    socket.on('answer', (data) => {
      socket.to(`stream-${data.sessionId}`).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
      socket.to(`stream-${data.sessionId}`).emit('ice-candidate', data);
    });

    // Student stops streaming
    socket.on('student-stop-stream', (data) => {
      const { sessionId } = data;
      
      if (activeStreams.has(sessionId)) {
        socket.to(`stream-${sessionId}`).emit('stream-ended', { sessionId });
        activeStreams.delete(sessionId);
        console.log(`Stream ${sessionId} ended`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Clean up active streams
      for (const [sessionId, stream] of activeStreams.entries()) {
        if (stream.studentSocket === socket.id) {
          socket.to(`stream-${sessionId}`).emit('stream-ended', { sessionId });
          activeStreams.delete(sessionId);
        } else if (stream.mentorSockets.includes(socket.id)) {
          stream.mentorSockets = stream.mentorSockets.filter(id => id !== socket.id);
          activeStreams.set(sessionId, stream);
        }
      }
    });
  });

  return io;
};

const getActiveStreams = () => {
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
      mentorCount: stream.mentorSockets.length,
      violations: stream.violations || 0,
      riskScore: stream.riskScore || 0,
      lastViolation: stream.lastViolation,
      duration,
      status: 'active',
      isActive: true
    });
  }
  return streams;
};

const terminateStream = (sessionId) => {
  if (activeStreams.has(sessionId)) {
    const stream = activeStreams.get(sessionId);
    
    // Notify all participants
    io.to(`stream-${sessionId}`).emit('stream-terminated', {
      sessionId,
      reason: 'Terminated by mentor'
    });
    
    // Remove from active streams
    activeStreams.delete(sessionId);
    console.log(`Stream ${sessionId} terminated by mentor`);
  }
};

module.exports = {
  initializeSocket,
  getActiveStreams,
  terminateStream
};