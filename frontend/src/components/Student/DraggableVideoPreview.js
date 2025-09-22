import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Minimize2, Maximize2 } from 'lucide-react';
import './DraggableVideoPreview.css';

const DraggableVideoPreview = ({ stream, isRecording }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.video-controls')) return;
    
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (isMinimized ? 120 : 200);
    const maxY = window.innerHeight - (isMinimized ? 80 : 150);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
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

  const containerStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: isMinimized ? '120px' : '200px',
    height: isMinimized ? '80px' : '150px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    border: '2px solid #374151',
    overflow: 'hidden',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: isDragging ? 'none' : 'all 0.2s ease'
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '8px'
  };

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const buttonStyle = {
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const statusStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '10px',
    color: 'white',
    backgroundColor: isRecording ? 'rgba(239,68,68,0.8)' : 'rgba(107,114,128,0.8)',
    padding: '2px 6px',
    borderRadius: '10px'
  };

  return (
    <div
      ref={containerRef}
      className={`video-preview-container ${isDragging ? 'dragging' : ''}`}
      style={containerStyle}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={videoRef}
        style={videoStyle}
        autoPlay
        muted
        playsInline
      />
      
      <div style={overlayStyle}>
        <div style={controlsStyle}>
          <div style={statusStyle}>
            {isRecording ? (
              <>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  marginRight: '4px',
                  animation: 'pulse 2s infinite'
                }} />
                {!isMinimized && 'REC'}
              </>
            ) : (
              <>
                <VideoOff size={8} style={{ marginRight: '2px' }} />
                {!isMinimized && 'OFF'}
              </>
            )}
          </div>
          
          <div className="video-controls" style={{ display: 'flex', gap: '4px' }}>
            <button
              style={buttonStyle}
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            

          </div>
        </div>
        
        {!isMinimized && (
          <div style={{
            fontSize: '10px',
            color: 'white',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '2px 4px',
            borderRadius: '4px'
          }}>
            Proctoring Active
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableVideoPreview;