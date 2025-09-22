import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Socket connected');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, connected };
};

export const useExamMonitoring = (examId) => {
  const { socket } = useSocket();
  const [examProgress, setExamProgress] = useState([]);

  useEffect(() => {
    if (!socket || !examId) return;

    socket.emit('join-exam', { examId });
    socket.on('exam-progress', (data) => {
      setExamProgress(prev => [...prev, data]);
    });

    return () => socket.off('exam-progress');
  }, [socket, examId]);

  const sendProgress = (questionIndex, timeRemaining) => {
    socket?.emit('exam-progress', { examId, questionIndex, timeRemaining });
  };

  return { examProgress, sendProgress };
};