import React, { useRef, useEffect, useState } from 'react';

const SimpleMonitor = React.forwardRef(({ sessionId }, ref) => {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsActive(false);
  };

  React.useImperativeHandle(ref, () => ({
    stopMonitoring: stopCamera
  }));

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '150px',
      height: '100px',
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
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '4px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        LIVE
      </div>
    </div>
  );
});

export default SimpleMonitor;