import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Initialize socket connection with error handling
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });
      
      setSocket(newSocket);

      // Join user room for notifications
      newSocket.emit('join-user-room', { userId: user.id, userType: user.role });

      // Listen for re-attempt request notifications (for mentors)
      newSocket.on('new-reattempt-request', (data) => {
        if (user.role === 'mentor') {
          const notification = {
            id: Date.now(),
            type: 'reattempt-request',
            title: 'New Re-attempt Request',
            message: `${data.studentName} requested re-attempt for ${data.examTitle}`,
            data: data,
            timestamp: new Date(),
            read: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast.success('New re-attempt request received!', {
            duration: 4000,
            onClick: () => {
              // Navigate to re-attempt requests
              window.location.href = '/mentor/re-attempts';
            }
          });
        }
      });

      // Listen for re-attempt response notifications (for learners)
      newSocket.on('reattempt-response', (data) => {
        if (user.role === 'learner') {
          const notification = {
            id: Date.now(),
            type: 'reattempt-response',
            title: `Re-attempt Request ${data.status}`,
            message: `Your re-attempt request for ${data.examTitle} has been ${data.status}`,
            data: data,
            timestamp: new Date(),
            read: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          const message = data.status === 'approved' 
            ? 'Your re-attempt request has been approved!' 
            : 'Your re-attempt request has been rejected.';
            
          toast[data.status === 'approved' ? 'success' : 'error'](message, {
            duration: 4000,
            onClick: () => {
              // Navigate to re-attempts page
              window.location.href = '/learner/re-attempts';
            }
          });
        }
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    socket,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};