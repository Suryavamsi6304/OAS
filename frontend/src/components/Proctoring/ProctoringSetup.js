import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Monitor, Wifi, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Proctoring Setup Component
 */
const ProctoringSetup = ({ onSetupComplete, examId }) => {
  const [checks, setChecks] = useState({
    camera: false,
    microphone: false,
    internet: false,
    browser: false,
    identity: false
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const videoRef = useRef(null);

  const steps = [
    { id: 'camera', label: 'Camera Access', icon: Camera },
    { id: 'microphone', label: 'Microphone Access', icon: Mic },
    { id: 'browser', label: 'Browser Security', icon: Monitor },
    { id: 'internet', label: 'Internet Connection', icon: Wifi },
    { id: 'identity', label: 'Identity Verification', icon: Shield }
  ];

  useEffect(() => {
    runSystemChecks();
    
    // Cleanup function to stop camera when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const runSystemChecks = async () => {
    // Check other systems first
    setChecks(prev => ({ 
      ...prev, 
      browser: document.fullscreenEnabled,
      internet: navigator.onLine 
    }));

    // Request camera access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(console.error);
        };
      }
      
      setChecks(prev => ({ ...prev, camera: true, microphone: true }));
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access denied. Please allow camera permissions and refresh the page.');
      setChecks(prev => ({ ...prev, camera: false, microphone: false }));
    }
  };

  const verifyIdentity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setChecks(prev => ({ ...prev, identity: true }));
      setIsVerifying(false);
    }, 2000);
  };

  const startProctoring = () => {
    const allChecksPass = Object.values(checks).every(check => check);
    if (allChecksPass) {
      // Stop the setup camera before starting exam
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      document.documentElement.requestFullscreen?.();
      onSetupComplete({
        sessionId: 'session_' + Date.now(),
        environmentCheck: checks,
        identityVerified: true
      });
    }
  };

  const allChecksComplete = Object.values(checks).every(check => check);

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
      zIndex: 1000,
      overflow: 'auto',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '600px',
        textAlign: 'center',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: 'auto'
      }}>
        <Shield size={48} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Proctoring Setup
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Complete system checks before starting your exam
        </p>

        {/* System Checks */}
        <div style={{ marginBottom: '32px' }}>
          {steps.map((step) => {
            const Icon = step.icon;
            const isComplete = checks[step.id];
            
            return (
              <div 
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: isComplete ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '8px',
                  border: `1px solid ${isComplete ? '#bbf7d0' : '#fecaca'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon size={20} style={{ 
                    color: isComplete ? '#10b981' : '#ef4444',
                    marginRight: '12px' 
                  }} />
                  <span style={{ fontWeight: '500' }}>{step.label}</span>
                </div>
                
                {isComplete ? (
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Camera Preview */}
        {checks.camera && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Camera Preview
            </h3>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                style={{
                  width: '200px',
                  height: '150px',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  backgroundColor: '#000',
                  objectFit: 'cover'
                }}
                onError={(e) => console.error('Video error:', e)}
              />
              <div style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                animation: 'pulse 2s infinite'
              }} />
            </div>
          </div>
        )}

        {/* Identity Verification */}
        {checks.camera && !checks.identity && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={verifyIdentity}
              disabled={isVerifying}
              className="btn btn-primary"
            >
              <Shield size={16} style={{ marginRight: '8px' }} />
              {isVerifying ? 'Verifying...' : 'Verify Identity'}
            </button>
          </div>
        )}

        {/* Rules */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Proctoring Rules
          </h3>
          <ul style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
            <li>• Keep face visible to camera</li>
            <li>• No tab switching allowed</li>
            <li>• Stay alone in room</li>
            <li>• No external devices</li>
          </ul>
        </div>

        <button
          onClick={startProctoring}
          disabled={!allChecksComplete}
          className={`btn ${allChecksComplete ? 'btn-success' : 'btn-secondary'}`}
          style={{ width: '100%', padding: '12px', fontSize: '16px' }}
        >
          {allChecksComplete ? 'Start Proctored Exam' : 'Complete All Checks'}
        </button>
      </div>
    </div>
  );
};

export default ProctoringSetup;