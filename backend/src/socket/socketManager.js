const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.examSessions = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"]
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }

  handleConnection(socket) {
    this.connectedUsers.set(socket.userId, socket);

    socket.on('join-exam', ({ examId }) => {
      socket.join(`exam-${examId}`);
      this.examSessions.set(`${examId}-${socket.userId}`, {
        userId: socket.userId,
        examId,
        startTime: Date.now()
      });
    });

    socket.on('exam-progress', ({ examId, questionIndex, timeRemaining }) => {
      this.io.to('admin-room').emit('exam-progress', {
        userId: socket.userId,
        examId,
        questionIndex,
        timeRemaining
      });
    });

    socket.on('disconnect', () => {
      this.connectedUsers.delete(socket.userId);
    });
  }

  notifyUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) socket.emit(event, data);
  }

  getActiveExamSessions() {
    return Array.from(this.examSessions.values());
  }
}

module.exports = new SocketManager();