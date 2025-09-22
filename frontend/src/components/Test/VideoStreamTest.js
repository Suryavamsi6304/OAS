import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const VideoStreamTest = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [receivedFrames, setReceivedFrames] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Initialize socket
    const { getSocketUrl } = require('../../utils/networkConfig');
    socketRef.current = io(getSocketUrl());
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('video-frame', (data) => {
      console.log('Received frame');
      setReceivedFrames(prev => prev + 1);
      if (videoRef.current) {
        videoRef.current.src = data.frameData;
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const sendFrame = () => {
        if (!isStreaming) return;
        
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(video, 0, 0, 320, 240);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.7);
        socketRef.current.emit('video-frame', {
          sessionId: 'test-session',
          frameData: dataURL,
          timestamp: Date.now()
        });
        
        setTimeout(sendFrame, 1000);
      };
      
      video.addEventListener('loadeddata', () => {
        setIsStreaming(true);
        sendFrame();
      });
      
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Video Stream Test</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={startStreaming} disabled={isStreaming}>
          Start Streaming
        </button>
        <button onClick={stopStreaming} disabled={!isStreaming}>
          Stop Streaming
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Sender (Hidden Canvas)</h3>
          <canvas ref={canvasRef} style={{ border: '1px solid black', display: 'none' }} />
          <p>Streaming: {isStreaming ? 'Yes' : 'No'}</p>
        </div>
        
        <div>
          <h3>Receiver</h3>
          <img 
            ref={videoRef} 
            style={{ 
              width: '320px', 
              height: '240px', 
              border: '1px solid black',
              backgroundColor: '#000'
            }} 
            alt="Received stream"
          />
          <p>Frames received: {receivedFrames}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoStreamTest;