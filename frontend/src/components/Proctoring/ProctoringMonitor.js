import React, { useEffect, useRef, useState } from 'react';
import { Eye, AlertTriangle, Shield, Camera, Move } from 'lucide-react';

/**
 * AI Proctoring Monitor Component
 */
const ProctoringMonitor = React.forwardRef(({ sessionId, onViolation }, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [violations, setViolations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [riskScore, setRiskScore] = useState(0);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [faceCount, setFaceCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [mentorRequestSent, setMentorRequestSent] = useState(false);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
      setupBehaviorTracking();
    }
    return () => cleanup();
  }, [isMonitoring]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => cleanup();
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
      
      // Start AI monitoring intervals
      setInterval(analyzeVideo, 5000);
      setInterval(checkEnvironment, 3000);
    } catch (error) {
      reportViolation('camera_access_denied', 'critical', 'Camera access was denied');
    }
  };

  const setupBehaviorTracking = () => {
    // Tab visibility monitoring
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        reportViolation('tab_switch', 'high', 'User switched tabs or minimized window');
      }
    });

    // Mouse leave detection
    document.addEventListener('mouseleave', () => {
      reportViolation('mouse_leave', 'medium', 'Mouse cursor left the exam window');
    });

    // Keyboard monitoring
    document.addEventListener('keydown', (e) => {
      const suspiciousKeys = ['F12', 'F11', 'PrintScreen'];
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        reportViolation('copy_paste_attempt', 'high', 'Copy/paste keyboard shortcut detected');
      }
      if (suspiciousKeys.includes(e.key)) {
        reportViolation('suspicious_key', 'medium', `Suspicious key pressed: ${e.key}`);
      }
    });

    // Right-click prevention
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      reportViolation('right_click', 'low', 'Right-click attempt detected');
    });
  };

  const analyzeVideo = () => {
    // Simulate AI analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Simulate face detection with count
      const detectedFaces = Math.floor(Math.random() * 4); // 0-3 faces
      setFaceCount(detectedFaces);
      
      if (detectedFaces === 0) {
        reportViolation('no_face_detected', 'high', 'No face detected in camera feed');
      } else if (detectedFaces > 1) {
        reportViolation('multiple_persons', 'critical', `${detectedFaces} faces detected - only 1 person allowed`);
      }

      // Simulate eye gaze tracking
      const lookingAway = Math.random() > 0.85; // 15% chance looking away
      if (lookingAway && detectedFaces === 1) {
        reportViolation('eye_gaze_violation', 'medium', 'Candidate looking away from screen');
      }
    }
  };

  const checkEnvironment = () => {
    // Simulate audio analysis
    const suspiciousAudio = Math.random() > 0.98; // 2% chance
    if (suspiciousAudio) {
      reportViolation('suspicious_audio', 'medium', 'Suspicious audio detected (voices/sounds)');
    }

    // Check network connectivity
    if (!navigator.onLine) {
      reportViolation('network_disconnected', 'high', 'Internet connection lost');
    }

    // Simulate mobile device detection
    const mobileDetected = Math.random() > 0.99; // 1% chance
    if (mobileDetected) {
      reportViolation('mobile_device', 'high', 'Mobile device detected in camera view');
    }
  };

  const reportViolation = (type, severity, details) => {
    const violation = {
      id: Date.now(),
      type,
      severity,
      details,
      timestamp: new Date().toISOString()
    };

    setViolations(prev => [...prev, violation]);
    
    // Calculate new risk score
    const severityScores = { low: 10, medium: 25, high: 50, critical: 100 };
    const newScore = Math.min(riskScore + severityScores[severity], 100);
    setRiskScore(newScore);

    // Report to parent component
    onViolation?.(violation, newScore);

    // Block user after multiple violations
    if (violations.length >= 3 || newScore >= 70) {
      blockUser(details);
    }
  };

  const blockUser = (reason) => {
    setIsBlocked(true);
    setBlockReason(reason);
    setIsMonitoring(false);
    // Send request to mentor
    sendMentorRequest(reason);
  };

  const sendMentorRequest = async (reason) => {
    try {
      // API call to notify mentor
      await fetch('/api/proctoring/mentor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reason,
          violations: violations.length,
          riskScore
        })
      });
      setMentorRequestSent(true);
    } catch (error) {
      console.error('Failed to send mentor request:', error);
    }
  };

  const checkMentorResponse = async () => {
    try {
      const response = await fetch(`/api/proctoring/mentor-response/${sessionId}`);
      const data = await response.json();
      
      if (data.approved) {
        setIsBlocked(false);
        setIsMonitoring(true);
        setViolations([]);
        setRiskScore(0);
      } else if (data.rejected) {
        terminateExam();
      }
    } catch (error) {
      console.error('Failed to check mentor response:', error);
    }
  };

  // Poll for mentor response every 5 seconds when blocked
  useEffect(() => {
    let interval;
    if (isBlocked && mentorRequestSent) {
      interval = setInterval(checkMentorResponse, 5000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, mentorRequestSent]);

  const terminateExam = () => {
    setIsMonitoring(false);
    alert('Exam terminated due to multiple violations. Please contact your administrator.');
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
        x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  const stopMonitoring = () => {
    setIsMonitoring(false);
    cleanup();
  };

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Expose stopMonitoring function to parent
  React.useImperativeHandle(ref, () => ({
    stopMonitoring
  }));

  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 60) return '#f59e0b';
    if (score < 80) return '#ef4444';
    return '#dc2626';
  };

  // Show blocked screen if user is blocked
  if (isBlocked) {
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
          <Shield size={64} style={{ color: '#ef4444', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#ef4444' }}>
            EXAM BLOCKED
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '24px', color: '#d1d5db' }}>
            Your exam has been suspended due to multiple proctoring violations.
          </p>
          <div style={{
            backgroundColor: '#374151',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Last Violation:</p>
            <p style={{ fontSize: '16px', color: '#fbbf24' }}>{blockReason}</p>
          </div>
          <div style={{
            backgroundColor: '#065f46',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '16px', color: '#10b981', marginBottom: '8px' }}>📧 Mentor Request Sent</p>
            <p style={{ fontSize: '14px', color: '#6ee7b7' }}>
              {mentorRequestSent ? 'Waiting for mentor approval...' : 'Sending request to mentor...'}
            </p>
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <p>• Contact your mentor if this takes too long</p>
            <p>• Do not refresh or close this page</p>
            <p>• Your progress has been saved</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Movable Round Video Button */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 1000,
          border: `3px solid ${faceCount > 1 ? '#ef4444' : faceCount === 1 ? '#10b981' : '#f59e0b'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: isDragging ? 'none' : 'border-color 0.3s ease'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
        
        {/* Face Count Indicator */}
        <div style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: faceCount > 1 ? '#ef4444' : faceCount === 1 ? '#10b981' : '#f59e0b',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {faceCount}
        </div>
        
        {/* Recording Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '5px',
          left: '5px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          animation: 'pulse 2s infinite'
        }} />
      </div>
      
      {/* Warning Toast for Multiple Faces */}
      {faceCount > 1 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <AlertTriangle size={20} style={{ color: '#ef4444', marginRight: '8px' }} />
          <span style={{ color: '#dc2626', fontWeight: '500' }}>
            Warning: {faceCount} faces detected. Only 1 person allowed.
          </span>
        </div>
      )}
    </>
  );
});

export default ProctoringMonitor;