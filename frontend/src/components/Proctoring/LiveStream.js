import React, { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const LiveStream = ({ sessionId, studentId, examId, onStreamEnd }) => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mentorWatching, setMentorWatching] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('mentor-joined', (data) => {
      setMentorWatching(true);
      console.log('Mentor joined the stream');
    });

    socketRef.current.on('stream-ended', () => {
      stopStream();
    });

    startStream();

    return () => {
      stopStream();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        },
        audio: true
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start streaming to socket
      socketRef.current.emit('start-stream', {
        sessionId,
        studentId,
        examId
      });

      // Send video frames periodically
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const sendFrame = () => {
        if (videoRef.current && isStreaming) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.5);
          socketRef.current.emit('video-stream', {
            sessionId,
            videoData: imageData
          });
        }
      };

      // Send frames every 200ms (5 FPS)
      const frameInterval = setInterval(sendFrame, 200);
      
      setIsStreaming(true);
      
      // Store interval for cleanup
      socketRef.current.frameInterval = frameInterval;

    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (socketRef.current?.frameInterval) {
      clearInterval(socketRef.current.frameInterval);
    }
    
    if (socketRef.current) {
      socketRef.current.emit('stop-stream', { sessionId });
    }
    
    setIsStreaming(false);
    onStreamEnd?.();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '200px',
      height: '150px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '2px solid #10b981',
      backgroundColor: '#000',
      zIndex: 1000
    }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)'
        }}
      />
      
      {/* Status indicators */}
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        display: 'flex',
        gap: '5px'
      }}>
        {/* Recording indicator */}
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isStreaming ? '#ef4444' : '#6b7280',
          animation: isStreaming ? 'pulse 2s infinite' : 'none'
        }} />
        
        {/* Mentor watching indicator */}
        {mentorWatching && (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6'
          }} />
        )}
      </div>
      
      {/* Stream info */}
      <div style={{
        position: 'absolute',
        bottom: '5px',
        left: '5px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        {isStreaming ? 'LIVE' : 'OFFLINE'}
        {mentorWatching && ' • WATCHED'}
      </div>
    </div>
  );
};

export default LiveStream;