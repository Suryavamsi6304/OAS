import React, { useState, useEffect, useRef } from 'react';
import { Eye, Video, AlertTriangle, User, Clock, Shield, Maximize2 } from 'lucide-react';
import axios from 'axios';

const LiveProctoring = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

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
      // In a real implementation, this would establish a WebRTC connection
      // For demo purposes, we'll simulate the connection
      const session = activeSessions.find(s => s.sessionId === sessionId);
      setSelectedSession(session);
      
      // Simulate video stream (in real app, this would be WebRTC stream)
      if (videoRef.current) {
        // This would be replaced with actual WebRTC stream from student
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
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
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
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
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Video size={12} style={{ marginRight: '4px' }} />
                      LIVE
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