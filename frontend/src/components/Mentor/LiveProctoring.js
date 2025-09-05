import React, { useState, useEffect, useRef } from 'react';
import { Eye, Video, AlertTriangle, User, Clock, Shield, Maximize2 } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const LiveProctoring = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastFrameTime, setLastFrameTime] = useState(null);

  useEffect(() => {
    fetchActiveSessions();
    initializeSocket();
    const interval = setInterval(fetchActiveSessions, 10000); // Refresh every 10 seconds
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to streaming server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from streaming server');
    });

    socketRef.current.on('video-frame', (data) => {
      if (selectedSession && data.sessionId === selectedSession.sessionId) {
        displayVideoFrame(data.frameData);
        setLastFrameTime(new Date());
      }
    });

    socketRef.current.on('new-stream-started', (data) => {
      console.log('New stream started:', data);
      fetchActiveSessions(); // Refresh sessions when new stream starts
    });

    socketRef.current.on('stream-ended', (data) => {
      console.log('Stream ended:', data);
      if (selectedSession && data.sessionId === selectedSession.sessionId) {
        setSelectedSession(null);
      }
      fetchActiveSessions();
    });
  };

  const displayVideoFrame = (frameData) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = frameData;
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get('/api/proctoring/active-sessions');
      setActiveSessions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToStudentCamera = async (sessionId) => {
    try {
      const session = activeSessions.find(s => s.sessionId === sessionId);
      setSelectedSession(session);
      
      // Join the student's stream room
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('mentor-join-stream', { sessionId });
        console.log('Joined stream for session:', sessionId);
      }
      
      // Clear any existing video
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Failed to connect to student camera:', error);
    }
  };

  const flagStudent = async (sessionId, reason) => {
    try {
      await axios.post(`/api/proctoring/${sessionId}/flag`, { reason });
      fetchActiveSessions(); // Refresh the list
    } catch (error) {
      console.error('Failed to flag student:', error);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await axios.post(`/api/proctoring/${sessionId}/terminate`);
      setSelectedSession(null);
      fetchActiveSessions();
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 80) return '#dc2626';
    if (riskScore >= 60) return '#ea580c';
    if (riskScore >= 40) return '#d97706';
    return '#10b981';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading active proctoring sessions...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Eye size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          Live Proctoring Monitor
        </h1>
        <div style={{
          marginLeft: '16px',
          padding: '4px 8px',
          backgroundColor: '#10b981',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {activeSessions.length} Active
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '24px' }}>
        {/* Active Sessions List */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Active Exam Sessions
          </h3>
          
          {activeSessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <Shield size={48} style={{ color: '#6b7280', margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ color: '#6b7280' }}>No active proctoring sessions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              {activeSessions.map((session) => (
                <div 
                  key={session.sessionId}
                  className="card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    border: selectedSession?.sessionId === session.sessionId ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: selectedSession?.sessionId === session.sessionId ? '#eff6ff' : 'white'
                  }}
                  onClick={() => connectToStudentCamera(session.sessionId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <User size={16} style={{ color: '#374151', marginRight: '8px' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {session.studentName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {session.examTitle}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getRiskColor(session.riskScore),
                      animation: 'pulse 2s infinite'
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                    <span>Risk: {session.riskScore}/100</span>
                    <span>Violations: {session.violations}</span>
                    <span>{Math.floor(session.duration / 60)}m</span>
                  </div>
                  
                  {session.lastViolation && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#dc2626'
                    }}>
                      <AlertTriangle size={12} style={{ marginRight: '4px', display: 'inline' }} />
                      {session.lastViolation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Monitor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedSession ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Monitoring: {selectedSession.studentName}
                  </h3>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                    {selectedSession.examTitle} • Session: {selectedSession.sessionId}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => flagStudent(selectedSession.sessionId, 'Flagged by mentor during live monitoring')}
                    className="btn"
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Flag Student
                  </button>
                  <button
                    onClick={() => terminateSession(selectedSession.sessionId)}
                    className="btn"
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Terminate
                  </button>
                </div>
              </div>
              
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', flex: 1, backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#000'
                    }}
                  />
                  
                  {/* Connection Status */}
                  {!isConnected && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div>Connecting to stream...</div>
                    </div>
                  )}
                  
                  {isConnected && !lastFrameTime && selectedSession && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <div>Waiting for student video...</div>
                      <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>Session: {selectedSession.sessionId}</div>
                    </div>
                  )}
                  
                  {/* Video Controls Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: isConnected && lastFrameTime ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Video size={12} style={{ marginRight: '4px' }} />
                      {isConnected && lastFrameTime ? 'LIVE' : 'NO SIGNAL'}
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: `rgba(${getRiskColor(selectedSession.riskScore) === '#dc2626' ? '220,38,38' : '16,185,129'},0.8)`,
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Risk: {selectedSession.riskScore}%
                    </div>
                  </div>
                  
                  {/* Student Info Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: '600' }}>{selectedSession.studentName}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} />
                      {Math.floor(selectedSession.duration / 60)}:{(selectedSession.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <Video size={64} style={{ color: '#6b7280', margin: '0 auto 16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Select a Session to Monitor
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Click on an active session from the left panel to view the student's camera feed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveProctoring;