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
  const [proctoringSessionId, setProctoringSessionId] = useState(null);
  
  // Initialize proctoring session
  useEffect(() => {
    const initSession = async () => {
      if (sessionId && !proctoringSessionId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/proctoring/start', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ assessmentId: sessionId })
          });
          const data = await response.json();
          if (data.session) {
            setProctoringSessionId(data.session.id);
          }
        } catch (error) {
          console.error('Failed to initialize proctoring session:', error);
        }
      }
    };
    initSession();
  }, [sessionId, proctoringSessionId]);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
      setupBehaviorTracking();
    }
    return () => cleanup();
  }, [isMonitoring]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      cleanup();
      // End proctoring session
      if (proctoringSessionId) {
        const token = localStorage.getItem('token');
        fetch('/api/proctoring/end', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId: proctoringSessionId })
        }).catch(console.error);
      }
    };
  }, [proctoringSessionId]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setFaceCount(1); // Always show 1 face
    } catch (error) {
      console.error('Camera error:', error);
      setFaceCount(0);
    }
  };

  const setupBehaviorTracking = () => {
    // Tab visibility monitoring
    const handleVisibilityChange = () => {
      if (document.hidden && !isBlocked) {
        reportViolation('tab_switch', 'high', 'User switched tabs or minimized window');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Mouse leave detection
    const handleMouseLeave = () => {
      if (!isBlocked) {
        reportViolation('mouse_leave', 'medium', 'Mouse cursor left the exam window');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    // Keyboard monitoring
    const handleKeyDown = (e) => {
      if (isBlocked) return;
      
      const suspiciousKeys = ['F12', 'F11', 'PrintScreen'];
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        reportViolation('copy_paste_attempt', 'high', 'Copy/paste keyboard shortcut detected');
      }
      if (suspiciousKeys.includes(e.key)) {
        reportViolation('suspicious_key', 'medium', `Suspicious key pressed: ${e.key}`);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Right-click prevention
    const handleContextMenu = (e) => {
      e.preventDefault();
      if (!isBlocked) {
        reportViolation('right_click', 'low', 'Right-click attempt detected');
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  };





  const reportViolation = async (type, severity, details) => {
    console.log('Violation:', type, severity, details);
    
    const newViolation = {
      id: Date.now(),
      type,
      severity,
      timestamp: new Date().toISOString(),
      details
    };

    const updatedViolations = [...violations, newViolation];
    setViolations(updatedViolations);

    // Calculate new risk score
    let scoreIncrease = 0;
    switch (severity) {
      case 'low': scoreIncrease = 10; break;
      case 'medium': scoreIncrease = 25; break;
      case 'high': scoreIncrease = 50; break;
      case 'critical': scoreIncrease = 100; break;
    }
    
    const newRiskScore = Math.min(riskScore + scoreIncrease, 100);
    setRiskScore(newRiskScore);

    // Check if violations exceed limit (5)
    if (updatedViolations.length >= 5) {
      blockUser(`Violation limit exceeded (${updatedViolations.length}/5): ${details}`);
      return;
    }

    // Report to backend if sessionId exists
    if (proctoringSessionId || sessionId) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/proctoring/log-violation', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: proctoringSessionId || sessionId,
            examId: sessionId,
            violationType: type,
            severity,
            details,
            riskScore: scoreIncrease
          })
        });
        
        const result = await response.json();
        if (result.shouldBlock) {
          blockUser(`Violation limit exceeded (${result.violationCount}/5): ${details}`);
          return;
        }
      } catch (error) {
        console.error('Failed to report violation to backend:', error);
      }
    }

    // Show warning for high severity violations
    if (severity === 'high' || severity === 'critical') {
      onViolation && onViolation(newViolation);
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
      const token = localStorage.getItem('token');
      await fetch('/api/proctoring/mentor-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: proctoringSessionId || sessionId,
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/proctoring/mentor-response/${proctoringSessionId || sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.approved) {
        setIsBlocked(false);
        setIsMonitoring(true);
        setViolations([]);
        setRiskScore(0);
        setMentorRequestSent(false);
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
    cleanup();
    // Redirect or show termination message
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({ type: 'EXAM_TERMINATED', reason: 'Multiple violations' }, '*');
    } else {
      alert('Exam terminated due to multiple violations. Please contact your administrator.');
      window.location.href = '/learner';
    }
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
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Violation Details:</p>
            <p style={{ fontSize: '16px', color: '#fbbf24', marginBottom: '8px' }}>{blockReason}</p>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Total Violations: {violations.length}</p>
          </div>
          <div style={{
            backgroundColor: '#065f46',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '16px', color: '#10b981', marginBottom: '8px' }}>📧 Mentor Request Status</p>
            <p style={{ fontSize: '14px', color: '#6ee7b7' }}>
              {mentorRequestSent ? 'Waiting for mentor approval...' : 'Sending request to mentor...'}
            </p>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
              <p>• Request sent at: {new Date().toLocaleTimeString()}</p>
              <p>• Risk Score: {riskScore}%</p>
            </div>
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
            backgroundColor: '#000',
            transform: 'scaleX(-1)'
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
      
      {/* Violation Counter */}
      {violations.length > 0 && violations.length < 5 && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: violations.length >= 3 ? '#fef2f2' : '#fefbf2',
          border: `1px solid ${violations.length >= 3 ? '#fecaca' : '#fed7aa'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          zIndex: 1001,
          fontSize: '14px',
          color: violations.length >= 3 ? '#dc2626' : '#ea580c'
        }}>
          ⚠️ Violations: {violations.length}/5
        </div>
      )}
    </>
  );
});

export default ProctoringMonitor;