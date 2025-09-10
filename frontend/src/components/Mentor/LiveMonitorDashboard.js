import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Eye, Users, Clock, AlertTriangle, Monitor, X, Flag, StopCircle } from 'lucide-react';

const LiveMonitorDashboard = () => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    initializeSocket();
    fetchActiveStreams();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('new-stream-started', (data) => {
      setActiveStreams(prev => [...prev, data]);
    });

    socketRef.current.on('stream-ended', (data) => {
      setActiveStreams(prev => prev.filter(stream => stream.sessionId !== data.sessionId));
      if (selectedStream?.sessionId === data.sessionId) {
        setSelectedStream(null);
      }
    });
  };

  const fetchActiveStreams = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/streaming/active-streams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setActiveStreams(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch active streams:', error);
    }
  };

  const watchStream = (stream) => {
    setSelectedStream(stream);
  };

  const closeViewer = () => {
    setSelectedStream(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
            Live Monitoring Dashboard
          </h1>
          <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
            Monitor students during proctored exams in real-time
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Connection status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '25px',
            backgroundColor: isConnected ? '#dcfce7' : '#fef2f2',
            color: isConnected ? '#166534' : '#dc2626',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444'
            }} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>

          <button
            onClick={fetchActiveStreams}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Active Streams Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {activeStreams.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <Monitor size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
            <h3 style={{ color: '#4b5563', marginBottom: '8px' }}>No Active Streams</h3>
            <p style={{ color: '#6b7280' }}>
              Students will appear here when they start proctored exams
            </p>
          </div>
        ) : (
          activeStreams.map((stream) => (
            <StreamCard
              key={stream.sessionId}
              stream={stream}
              onWatch={() => watchStream(stream)}
            />
          ))
        )}
      </div>

      {/* Live Stream Viewer Modal */}
      {selectedStream && (
        <LiveStreamViewer
          stream={selectedStream}
          onClose={closeViewer}
          socket={socketRef.current}
        />
      )}
    </div>
  );
};

const StreamCard = ({ stream, onWatch }) => {
  const [lastSeen, setLastSeen] = useState('Just now');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(stream.startTime);
      const diff = Math.floor((now - start) / 1000);
      
      if (diff < 60) {
        setLastSeen('Just now');
      } else if (diff < 3600) {
        setLastSeen(`${Math.floor(diff / 60)}m ago`);
      } else {
        setLastSeen(`${Math.floor(diff / 3600)}h ago`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stream.startTime]);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease'
    }}>
      {/* Stream header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px'
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
            {stream.studentName || `Student ${stream.studentId}`}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
            ID: {stream.studentId}
          </p>
        </div>
        
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          animation: 'pulse 2s infinite'
        }} />
      </div>

      {/* Stream info */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '15px',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={14} />
          {lastSeen}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={14} />
          {stream.mentorCount || 0} watching
        </div>
      </div>

      {/* Exam info */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <div style={{ fontSize: '13px', color: '#4b5563' }}>
          <strong>Exam:</strong> {stream.examTitle || `Exam ${stream.examId}`}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onWatch}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Eye size={16} />
        Watch Live Stream
      </button>
    </div>
  );
};

const LiveStreamViewer = ({ stream, onClose, socket }) => {
  const canvasRef = useRef(null);
  const [isReceivingFrames, setIsReceivingFrames] = useState(false);
  const [lastFrameTime, setLastFrameTime] = useState(null);

  useEffect(() => {
    // Join the stream as mentor
    socket.emit('mentor-join-stream', {
      sessionId: stream.sessionId,
      mentorId: 'mentor-' + Date.now()
    });

      // Listen for video frames
    socket.on('video-frame', (data) => {
      if (data.sessionId === stream.sessionId) {
        displayFrame(data.frameData);
        setIsReceivingFrames(true);
        setLastFrameTime(new Date());
      }
    });
    
    // Listen for stream updates
    socket.on('stream-updated', (data) => {
      if (data.sessionId === stream.sessionId) {
        // Update stream info if needed
      }
    });

    return () => {
      socket.emit('mentor-leave-stream', { sessionId: stream.sessionId });
      socket.off('video-frame');
    };
  }, [stream.sessionId, socket]);

  const displayFrame = (frameData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = frameData;
  };

  const flagStudent = async () => {
    try {
      await fetch(`http://localhost:3001/api/proctoring/${stream.sessionId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Flagged during live monitoring'
        })
      });
      alert('Student flagged successfully');
    } catch (error) {
      alert('Failed to flag student');
    }
  };

  const terminateSession = async () => {
    if (window.confirm('Are you sure you want to terminate this exam session?')) {
      try {
        await fetch(`http://localhost:3001/api/proctoring/${stream.sessionId}/terminate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        onClose();
      } catch (error) {
        alert('Failed to terminate session');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        width: '85%',
        maxWidth: '800px',
        height: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              Live Stream - {stream.studentName || `Student ${stream.studentId}`}
            </h2>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
              {stream.examTitle} • {lastFrameTime ? lastFrameTime.toLocaleTimeString() : 'No signal'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
          {/* Video area */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <div style={{
              position: 'relative',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              height: '100%',
              minHeight: '300px'
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
              
              {!isReceivingFrames && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <Eye size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>Waiting for video stream...</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={flagStudent}
              style={{
                padding: '12px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Flag size={16} />
              Flag Student
            </button>
            
            <button
              onClick={terminateSession}
              style={{
                padding: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <StopCircle size={16} />
              Terminate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitorDashboard;