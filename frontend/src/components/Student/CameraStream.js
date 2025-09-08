import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';

const CameraStream = ({ examId, examTitle, onStreamStart, onStreamEnd, isExamActive = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (isExamActive) {
      initializeCamera();
      initializeSocket();
    }
    
    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isExamActive]);

  const initializeSocket = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to streaming server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from streaming server');
    });

    socketRef.current.on('exam-terminated', (data) => {
      if (data.sessionId === sessionId) {
        console.log('🛑 Exam terminated by mentor');
        alert('Your exam has been terminated by a mentor.');
        stopStreaming();
        if (onStreamEnd) onStreamEnd();
      }
    });
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 10 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasPermission(true);
      setError(null);
      
      // Auto-start streaming when exam is active
      if (isExamActive) {
        startStreaming();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access is required for proctored exams. Please allow camera access and refresh the page.');
      setHasPermission(false);
    }
  };

  const startStreaming = () => {
    if (!streamRef.current || !socketRef.current || isStreaming) return;

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setIsStreaming(true);

    // Notify server about stream start
    socketRef.current.emit('student-start-stream', {
      sessionId: newSessionId,
      studentId: 'current_student', // Replace with actual student ID
      studentName: 'Current Student', // Replace with actual student name
      examId: examId,
      examTitle: examTitle
    });

    // Start capturing and sending frames
    intervalRef.current = setInterval(() => {
      captureAndSendFrame(newSessionId);
    }, 1000); // Send frame every second

    if (onStreamStart) onStreamStart(newSessionId);
    console.log('🎥 Started streaming:', newSessionId);
  };

  const stopStreaming = () => {
    if (!isStreaming) return;

    setIsStreaming(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (socketRef.current && sessionId) {
      socketRef.current.emit('student-end-stream', { sessionId });
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setSessionId(null);
    console.log('🛑 Stopped streaming');
  };

  const captureAndSendFrame = (currentSessionId) => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 and send
    canvas.toBlob((blob) => {
      if (blob && socketRef.current && isStreaming) {
        const reader = new FileReader();
        reader.onload = () => {
          socketRef.current.emit('video-frame', {
            sessionId: currentSessionId,
            frameData: reader.result,
            timestamp: Date.now()
          });
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.7);
  };

  const toggleStreaming = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  if (!isExamActive) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid #e5e7eb',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Camera size={16} style={{ marginRight: '8px', color: '#374151' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            Proctoring
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isStreaming ? '#10b981' : '#ef4444',
            animation: isStreaming ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {isStreaming ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Video Area */}
      <div style={{ padding: '16px' }}>
        {error ? (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <AlertTriangle size={16} style={{ color: '#dc2626', marginRight: '8px' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                Camera Error
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#7f1d1d', margin: 0 }}>
              {error}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              position: 'relative',
              backgroundColor: '#000',
              borderRadius: '6px',
              overflow: 'hidden',
              aspectRatio: '4/3'
            }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              {/* Connection Status */}
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                padding: '4px 8px',
                backgroundColor: isConnected ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)',
                color: 'white',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                {isConnected ? '● CONNECTED' : '● DISCONNECTED'}
              </div>

              {/* Session ID */}
              {sessionId && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}>
                  Session: {sessionId.slice(-8)}
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px'
            }}>
              <button
                onClick={toggleStreaming}
                disabled={!hasPermission || !isConnected}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isStreaming ? '#dc2626' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: hasPermission && isConnected ? 'pointer' : 'not-allowed',
                  opacity: hasPermission && isConnected ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isStreaming ? (
                  <>
                    <CameraOff size={12} style={{ marginRight: '4px' }} />
                    Stop Stream
                  </>
                ) : (
                  <>
                    <Camera size={12} style={{ marginRight: '4px' }} />
                    Start Stream
                  </>
                )}
              </button>
            </div>

            {/* Status Messages */}
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
              {!hasPermission && 'Camera permission required'}
              {hasPermission && !isConnected && 'Connecting to server...'}
              {hasPermission && isConnected && !isStreaming && 'Ready to stream'}
              {isStreaming && 'Streaming to mentors'}
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraStream;