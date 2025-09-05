import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

// Global singleton to prevent multiple camera instances
let globalCameraElement = null;
let globalCameraActive = false;

const ExamCamera = forwardRef(({ onCameraReady, examId, studentId }, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 140, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [violations, setViolations] = useState([]);
  const [isExamTerminated, setIsExamTerminated] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    initializeCamera();
    initializeSocket();
    
    return () => {
      stopCamera();
      stopStreaming();
    };
  }, []);

  // Expose stopCamera method to parent component
  useImperativeHandle(ref, () => ({
    stopCamera: () => {
      stopCamera();
    }
  }), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const initializeCamera = async () => {
    if (videoRef.current?.srcObject) {
      return; // Prevent duplicate initialization
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 360 },
          facingMode: 'user'
        }
      });

      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
        onCameraReady?.(true);
        startViolationDetection();
        startStreaming();
      }
    } catch (err) {
      setError(err.message);
      onCameraReady?.(false);
    }
  };

  const initializeSocket = () => {
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('student-start-stream', {
        sessionId,
        studentId: studentId || 'student-' + Date.now(),
        examId: examId || 'exam-' + Date.now(),
        examTitle: 'Live Exam'
      });
    });

    socketRef.current.on('exam-terminated', (data) => {
      alert(`Exam terminated by mentor: ${data.reason}`);
      setIsExamTerminated(true);
    });
  };

  const startStreaming = () => {
    if (streamIntervalRef.current) return;
    
    streamIntervalRef.current = setInterval(() => {
      if (videoRef.current && socketRef.current) {
        captureAndSendFrame();
      }
    }, 200); // Send frame every 200ms (5 FPS)
  };

  const stopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('student-end-stream', { sessionId });
      socketRef.current.disconnect();
    }
  };

  const captureAndSendFrame = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      canvas.width = 320; // Reduced size for streaming
      canvas.height = 240;
      
      // Draw mirrored video (as student sees it)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      
      const frameData = canvas.toDataURL('image/jpeg', 0.7);
      
      socketRef.current.emit('video-frame', {
        sessionId,
        frameData,
        timestamp: Date.now()
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
        track.enabled = false;
      });
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    setIsActive(false);
    stopStreaming();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 120, e.clientY - dragOffset.y))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const startViolationDetection = () => {
    // Monitor tab switching (Don't use multiple screens/devices)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        addViolation('VIOLATION: Used multiple screens or switched tabs');
      }
    });

    // Monitor right-click (Don't tamper with settings)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      addViolation('VIOLATION: Attempted to access context menu');
    });

    // Monitor copy/paste and dev tools (Don't tamper with settings)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v')) {
        addViolation('VIOLATION: Copy/paste attempt detected');
      }
      if (e.key === 'F12') {
        addViolation('VIOLATION: Attempted to open developer tools');
      }
      if (e.altKey && e.key === 'Tab') {
        addViolation('VIOLATION: Alt+Tab detected - switching applications');
      }
    });

    // Check camera compliance every 3 seconds
    setInterval(() => {
      if (isActive && videoRef.current) {
        checkCameraCompliance();
      }
    }, 3000);

    // Monitor mouse leaving screen (looking around excessively)
    let mouseLeaveCount = 0;
    document.addEventListener('mouseleave', () => {
      mouseLeaveCount++;
      if (mouseLeaveCount > 3) {
        addViolation('VIOLATION: Excessive mouse movement outside screen');
        mouseLeaveCount = 0;
      }
    });
  };

  const checkCameraCompliance = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Draw original (non-mirrored) video for analysis
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0);
      ctx.restore();
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const brightness = calculateBrightness(imageData);
      const variance = calculateVariance(imageData);
      const hasPersonPresent = detectPersonPresence(imageData);
      const faceCount = countFaces(imageData);
      
      // Rule: Person must ALWAYS be in camera frame
      if (!hasPersonPresent) {
        addViolation('VIOLATION: Person left camera frame - must stay visible');
      }
      
      // Additional check for empty/static frame
      if (variance < 80) {
        addViolation('VIOLATION: Camera shows empty or static frame');
      }
      
      // Rule: Don't allow others in the room
      if (faceCount > 1) {
        addViolation('VIOLATION: Multiple people detected in camera');
      }
      
      // Rule: Keep face clearly visible (brightness check)
      if (brightness < 30) {
        addViolation('VIOLATION: Face not clearly visible - too dark');
      }
      
      // Rule: Don\'t cover or block camera
      if (brightness > 250 || variance < 10) {
        addViolation('VIOLATION: Camera appears blocked or covered');
      }
      
      // Rule: Stay in camera frame (check if person left)
      if (variance < 50) {
        addViolation('VIOLATION: Person not in camera frame');
      }
    } else {
      // Rule: Don\'t tamper with camera settings
      addViolation('VIOLATION: Camera feed interrupted or tampered');
    }
  };

  const calculateVariance = (imageData) => {
    const data = imageData.data;
    let sum = 0;
    let sumSquares = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += brightness;
      sumSquares += brightness * brightness;
    }
    
    const mean = sum / pixelCount;
    const variance = (sumSquares / pixelCount) - (mean * mean);
    return variance;
  };

  const countFaces = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Detect face-like regions using improved skin detection + shape analysis
    const faceRegions = [];
    const visited = new Set();
    
    for (let y = 20; y < height - 20; y += 8) {
      for (let x = 20; x < width - 20; x += 8) {
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        
        if (isSkinPixel(data, x, y, width)) {
          const region = floodFill(data, x, y, width, height, visited);
          
          // Check if region is face-sized and shaped
          if (region.size > 30 && region.size < 200) {
            const bounds = getRegionBounds(region);
            const aspectRatio = bounds.width / bounds.height;
            
            // Face-like aspect ratio (0.7 to 1.3)
            if (aspectRatio > 0.7 && aspectRatio < 1.3) {
              faceRegions.push(region);
            }
          }
        }
      }
    }
    
    // Return actual count of faces detected
    return faceRegions.length;
  };

  const isSkinPixel = (data, x, y, width) => {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Improved skin detection with multiple conditions
    const rg = r - g;
    const rb = r - b;
    const gb = g - b;
    
    return (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      rg > 15 && rb > 15 &&
      Math.abs(gb) < 20
    );
  };

  const floodFill = (data, startX, startY, width, height, visited) => {
    const region = new Set();
    const stack = [[startX, startY]];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }
      
      if (!isSkinPixel(data, x, y, width)) {
        continue;
      }
      
      visited.add(key);
      region.add(key);
      
      // Add neighbors
      stack.push([x + 8, y], [x - 8, y], [x, y + 8], [x, y - 8]);
    }
    
    return region;
  };

  const getRegionBounds = (region) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const key of region) {
      const [x, y] = key.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    return {
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const detectPersonPresence = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let skinPixels = 0;
    let totalPixels = 0;
    
    // Sample every 5th pixel for performance
    for (let i = 0; i < data.length; i += 20) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalPixels++;
      
      // Simple skin detection
      if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
        skinPixels++;
      }
    }
    
    // Stricter threshold - person must be clearly visible
    const skinRatio = skinPixels / totalPixels;
    return skinRatio > 0.03 && skinPixels > 10;
  };

  const calculateBrightness = (imageData) => {
    let sum = 0;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return sum / (data.length / 4);
  };

  const addViolation = (message) => {
    const violation = {
      id: Date.now(),
      message,
      time: new Date().toLocaleTimeString()
    };
    
    setViolations(prev => {
      const newViolations = [...prev, violation];
      
      // Terminate exam after 3 violations
      if (newViolations.length >= 3) {
        terminateExam(newViolations);
      } else if (newViolations.length === 2) {
        alert('WARNING: 2 violations detected! One more violation will terminate your exam.');
      } else if (newViolations.length === 1) {
        alert('WARNING: First violation detected! Please follow camera rules.');
      }
      
      return newViolations;
    });
  };

  const terminateExam = (violationList) => {
    setIsExamTerminated(true);
    
    // Stop camera
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    // Show termination message
    const violationMessages = violationList.map(v => v.message).join('\n');
    alert(`EXAM TERMINATED\n\nReason: 3 violations detected\n\nViolations:\n${violationMessages}\n\nYour exam has been automatically submitted and flagged for review.`);
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/learner';
    }, 2000);
  };

  // Always render the camera component
  
  if (error || isExamTerminated) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'white'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#1f2937',
          borderRadius: '16px',
          border: '2px solid #ef4444',
          maxWidth: '500px'
        }}>
          <AlertCircle size={64} style={{ color: '#ef4444', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#ef4444' }}>
            {isExamTerminated ? 'EXAM TERMINATED' : 'CAMERA ERROR'}
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '24px', color: '#d1d5db' }}>
            {isExamTerminated 
              ? 'Your exam has been terminated due to multiple rule violations.' 
              : 'Camera access is required to continue the exam.'}
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            {isExamTerminated 
              ? 'Redirecting to dashboard...' 
              : 'Please refresh and allow camera access.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid #10b981',
        backgroundColor: '#000',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)'
        }}
      />
      
      {isActive && (
        <>
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ color: 'white', fontSize: '10px', fontWeight: '500' }}>
              LIVE
            </span>
          </div>
          
          {violations.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              {violations.length}
            </div>
          )}
        </>
      )}
      
      {violations.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '8px 12px',
          zIndex: 1001,
          fontSize: '12px',
          color: '#dc2626',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          ⚠️ {violations[violations.length - 1]?.message}
        </div>
      )}
    </div>
  );
});

export default ExamCamera;