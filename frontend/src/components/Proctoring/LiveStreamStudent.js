import React, { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Camera, Eye, Wifi } from 'lucide-react';

const LiveStreamStudent = ({ sessionId, studentId, examId }) => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mentorsWatching, setMentorsWatching] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    initializeStream();
    return () => {
      cleanup();
    };
  }, []);

  const initializeStream = async () => {
    try {
      // Initialize socket connection
      socketRef.current = io('http://localhost:3001');
      
      socketRef.current.on('connect', () => {
        setConnectionStatus('connected');
        startVideoStream();
      });

      socketRef.current.on('mentor-joined', () => {
        setMentorsWatching(prev => prev + 1);
      });

      socketRef.current.on('mentor-left', () => {
        setMentorsWatching(prev => Math.max(0, prev - 1));
      });

      socketRef.current.on('disconnect', () => {
        setConnectionStatus('disconnected');
        setIsStreaming(false);
      });

    } catch (error) {
      console.error('Failed to initialize stream:', error);
      setConnectionStatus('error');
    }
  };

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          frameRate: { ideal: 15, min: 10 }
        },
        audio: true
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Join streaming room
      socketRef.current.emit('student-start-stream', {
        sessionId,
        studentId,
        examId
      });

      // Start sending video frames
      startFrameCapture();
      setIsStreaming(true);

    } catch (error) {
      console.error('Failed to start video stream:', error);
      setConnectionStatus('camera-error');
    }
  };

  const startFrameCapture = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const captureFrame = () => {
      if (videoRef.current && isStreaming && socketRef.current?.connected) {
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        
        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 with compression
          const frameData = canvas.toDataURL('image/jpeg', 0.6);
          
          socketRef.current.emit('video-frame', {
            sessionId,
            frameData,
            timestamp: Date.now()
          });
        }
      }
    };

    // Send frames at 5 FPS (every 200ms)
    const frameInterval = setInterval(captureFrame, 200);
    socketRef.current.frameInterval = frameInterval;
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (socketRef.current?.frameInterval) {
      clearInterval(socketRef.current.frameInterval);
    }
    
    if (socketRef.current) {
      socketRef.current.emit('student-stop-stream', { sessionId });
      socketRef.current.disconnect();
    }
    
    setIsStreaming(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return isStreaming ? '#10b981' : '#f59e0b';
      case 'connecting': return '#6b7280';
      case 'disconnected': return '#ef4444';
      case 'camera-error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return isStreaming ? 'STREAMING' : 'READY';
      case 'connecting': return 'CONNECTING';
      case 'disconnected': return 'OFFLINE';
      case 'camera-error': return 'CAMERA ERROR';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '250px',
      height: '180px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: `3px solid ${getStatusColor()}`,
      backgroundColor: '#000',
      zIndex: 1000,
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
    }}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)' // Mirror effect
        }}
      />
      
      {/* Status overlay */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          color: 'white',
          fontWeight: '500'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            animation: isStreaming ? 'pulse 2s infinite' : 'none'
          }} />
          {getStatusText()}
        </div>

        {/* Mentor watching indicator */}
        {mentorsWatching > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            color: 'white',
            fontWeight: '500'
          }}>
            <Eye size={10} />
            {mentorsWatching}
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        right: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '4px 8px',
          borderRadius: '8px',
          fontSize: '10px',
          color: 'white',
          fontWeight: '500'
        }}>
          PROCTORED EXAM
        </div>

        {connectionStatus === 'camera-error' && (
          <button
            onClick={startVideoStream}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        )}
      </div>

      {/* No video placeholder */}
      {!isStreaming && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white'
        }}>
          <Camera size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            {connectionStatus === 'connecting' ? 'Starting camera...' : 'Camera unavailable'}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamStudent;