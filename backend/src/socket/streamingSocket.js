const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class StreamingSocket {
  constructor(server) {
    const allowedOrigins = process.env.SOCKET_ORIGINS ? process.env.SOCKET_ORIGINS.split(',') : ['http://localhost:3000'];
    this.io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
      }
    });
    
    this.activeStreams = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    // Authentication middleware
    this.io.use((socket, next) => {
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

    this.io.on('connection', (socket) => {
      socket.on('student-start-stream', (data) => {
        if (socket.userRole !== 'learner') {
          return socket.emit('error', 'Unauthorized');
        }
        const { sessionId, studentId, examId, examTitle } = data;
        
        this.activeStreams.set(sessionId, {
          sessionId, studentId, examId, examTitle,
          startTime: new Date(), mentorCount: 0
        });
        
        this.io.emit('new-stream-started', {
          sessionId, studentId, examId, examTitle,
          startTime: new Date()
        });
      });

      socket.on('video-frame', (data) => {
        socket.broadcast.emit('video-frame', data);
      });

      socket.on('student-end-stream', (data) => {
        this.activeStreams.delete(data.sessionId);
        this.io.emit('stream-ended', data);
      });

      socket.on('mentor-join-stream', (data) => {
        if (socket.userRole !== 'mentor' && socket.userRole !== 'admin') {
          return socket.emit('error', 'Unauthorized');
        }
        
        const stream = this.activeStreams.get(data.sessionId);
        if (stream) stream.mentorCount++;
      });

      socket.on('disconnect', () => {
        for (const [sessionId, stream] of this.activeStreams.entries()) {
          this.activeStreams.delete(sessionId);
          this.io.emit('stream-ended', { sessionId });
        }
      });
    });
  }

  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  terminateStream(sessionId) {
    const stream = this.activeStreams.get(sessionId);
    if (stream) {
      this.io.emit('exam-terminated', {
        sessionId,
        reason: 'Terminated by mentor'
      });
      this.activeStreams.delete(sessionId);
      this.io.emit('stream-ended', { sessionId });
      return true;
    }
    return false;
  }
}

module.exports = StreamingSocket;