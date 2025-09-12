import React, { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Eye, Users, Clock, AlertTriangle } from 'lucide-react';

const LiveStreamViewer = ({ sessionId, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamInfo, setStreamInfo] = useState(null);
  const [lastFrameTime, setLastFrameTime] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // Join the stream as a mentor
      socketRef.current.emit('join-stream', {
        sessionId,
        mentorId: 'mentor-' + Date.now()
      });
    });

    socketRef.current.on('video-stream', (data) => {
      if (data.sessionId === sessionId) {
        displayFrame(data.videoData);
        setLastFrameTime(new Date());
      }
    });

    socketRef.current.on('stream-ended', () => {
      setIsConnected(false);
      onClose?.();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  const displayFrame = (imageData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = imageData;
  };

  const flagStudent = () => {
    // Send flag request to backend
    fetch(`/api/proctoring/${sessionId}/flag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        reason: 'Flagged by mentor during live monitoring'
      })
    });
  };

  const terminateSession = () => {
    if (window.confirm('Are you sure you want to terminate this exam session?')) {
      fetch(`/api/proctoring/${sessionId}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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
        borderRadius: '12px',
        padding: '20px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              Live Stream Monitor
            </h2>
            <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
              Session: {sessionId}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Connection status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '20px',
              backgroundColor: isConnected ? '#dcfce7' : '#fef2f2',
              color: isConnected ? '#166534' : '#dc2626',
              fontSize: '12px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444'
              }} />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </div>
            
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Video Stream */}
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start'
        }}>
          {/* Main video area */}
          <div style={{ flex: 1 }}>
            <div style={{
              position: 'relative',
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              aspectRatio: '4/3'
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
              
              {!isConnected && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <Eye size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <p>Waiting for student stream...</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls panel */}
          <div style={{
            width: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* Stream info */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>
                Stream Info
              </h4>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <div style={{ marginBottom: '5px' }}>
                  <Clock size={12} style={{ marginRight: '5px' }} />
                  {lastFrameTime ? lastFrameTime.toLocaleTimeString() : 'No data'}
                </div>
                <div>
                  <Users size={12} style={{ marginRight: '5px' }} />
                  1 viewer
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                onClick={flagStudent}
                style={{
                  padding: '10px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <AlertTriangle size={16} />
                Flag Student
              </button>
              
              <button
                onClick={terminateSession}
                style={{
                  padding: '10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Terminate Session
              </button>
            </div>

            {/* Instructions */}
            <div style={{
              padding: '10px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#1e40af'
            }}>
              <strong>Live Monitoring:</strong>
              <br />• Watch student in real-time
              <br />• Flag suspicious behavior
              <br />• Terminate if needed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamViewer;