import React, { useEffect, useRef, useState } from 'react';
import { Eye, AlertTriangle, Shield, Camera } from 'lucide-react';

/**
 * AI Proctoring Monitor Component
 */
const ProctoringMonitor = ({ sessionId, onViolation }) => {
  const videoRef = useRef(null);
  const [violations, setViolations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
      setupBehaviorTracking();
    }
    return () => cleanup();
  }, [isMonitoring]);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
      
      // Simulate face detection
      const faceDetected = Math.random() > 0.1; // 90% chance face is detected
      if (!faceDetected) {
        reportViolation('no_face_detected', 'high', 'No face detected in camera feed');
      }

      // Simulate multiple person detection
      const multipleFaces = Math.random() > 0.95; // 5% chance multiple faces
      if (multipleFaces) {
        reportViolation('multiple_persons', 'critical', 'Multiple persons detected');
      }

      // Simulate eye gaze tracking
      const lookingAway = Math.random() > 0.85; // 15% chance looking away
      if (lookingAway) {
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

    // Auto-terminate if risk too high
    if (newScore >= 90) {
      terminateExam();
    }
  };

  const terminateExam = () => {
    setIsMonitoring(false);
    alert('Exam terminated due to multiple violations. Please contact your administrator.');
  };

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 60) return '#f59e0b';
    if (score < 80) return '#ef4444';
    return '#dc2626';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      border: '2px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Shield size={20} style={{ color: '#3b82f6', marginRight: '8px' }} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>Proctoring Active</span>
        </div>
        <div style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
      </div>

      {/* Camera Feed */}
      <div style={{ padding: '16px' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width: '100%',
            height: '120px',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Risk Score */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Risk Score</span>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: getRiskColor(riskScore)
          }}>
            {riskScore}/100
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${riskScore}%`,
            height: '100%',
            backgroundColor: getRiskColor(riskScore),
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Recent Violations */}
      {violations.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            Recent Alerts ({violations.length})
          </h4>
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {violations.slice(-3).map((violation) => (
              <div 
                key={violation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              >
                <AlertTriangle size={12} style={{ color: '#ef4444', marginRight: '6px' }} />
                <span style={{ color: '#374151' }}>{violation.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Camera size={16} style={{ color: '#10b981', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '10px', color: '#6b7280' }}>Camera</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Eye size={16} style={{ color: '#10b981', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '10px', color: '#6b7280' }}>AI Monitor</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Shield size={16} style={{ color: '#10b981', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '10px', color: '#6b7280' }}>Secure</div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringMonitor;