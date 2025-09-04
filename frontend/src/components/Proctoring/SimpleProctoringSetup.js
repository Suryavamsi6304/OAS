import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle } from 'lucide-react';

const SimpleProctoringSetup = ({ onSetupComplete, examId }) => {
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Please allow camera access to continue');
    }
  };

  const startExam = () => {
    onSetupComplete({
      sessionId: 'session_' + Date.now(),
      cameraEnabled: cameraReady
    });
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '500px',
        textAlign: 'center'
      }}>
        <Camera size={48} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Camera Setup
        </h2>
        
        {cameraReady && (
          <div style={{ marginBottom: '24px' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{
                width: '200px',
                height: '150px',
                borderRadius: '8px',
                border: '2px solid #10b981',
                transform: 'scaleX(-1)'
              }}
            />
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: '12px',
          backgroundColor: cameraReady ? '#f0fdf4' : '#fef2f2',
          borderRadius: '8px'
        }}>
          <CheckCircle size={20} style={{ 
            color: cameraReady ? '#10b981' : '#ef4444' 
          }} />
          <span style={{ 
            color: cameraReady ? '#10b981' : '#ef4444',
            fontWeight: '500'
          }}>
            {cameraReady ? 'Camera Ready' : 'Setting up camera...'}
          </span>
        </div>

        <button
          onClick={startExam}
          disabled={!cameraReady}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: cameraReady ? '#10b981' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: cameraReady ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          Start Exam
        </button>
      </div>
    </div>
  );
};

export default SimpleProctoringSetup;