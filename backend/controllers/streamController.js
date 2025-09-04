const { Server } = require('socket.io');

let io;
const activeStreams = new Map(); // sessionId -> { studentSocket, mentorSockets[], studentId, examId, startTime }

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Student starts streaming
    socket.on('student-start-stream', (data) => {
      const { sessionId, studentId, examId } = data;
      
      activeStreams.set(sessionId, {
        studentSocket: socket.id,
        mentorSockets: [],
        studentId,
        examId,
        startTime: new Date()
      });
      
      socket.join(`stream-${sessionId}`);
      console.log(`Student ${studentId} started streaming for session ${sessionId}`);
      
      // Notify all mentors that a new stream is available
      socket.broadcast.emit('new-stream-started', {
        sessionId,
        studentId,
        examId,
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
      
      // Broadcast frame to all mentors watching this stream
      socket.to(`stream-${sessionId}`).emit('video-frame', {
        sessionId,
        frameData,
        timestamp
      });
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
    streams.push({
      sessionId,
      studentId: stream.studentId,
      examId: stream.examId,
      startTime: stream.startTime,
      mentorCount: stream.mentorSockets.length,
      isActive: true
    });
  }
  return streams;
};

module.exports = {
  initializeSocket,
  getActiveStreams
};