import React, { useState, useEffect, useRef } from 'react';
import { Eye, Video, AlertTriangle, User, Clock, Shield, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import DashboardLayout from '../Layout/DashboardLayout';

const LiveStreamMonitor = () => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [streamStats, setStreamStats] = useState({});
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    initializeSocket();
    fetchActiveStreams();
    
    const interval = setInterval(() => {
      fetchActiveStreams();
      updateStreamStats();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl, {
      transports: ['polling', 'websocket']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to streaming server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from streaming server');
    });

    socketRef.current.on('new-stream-started', (data) => {
      console.log('🎥 New stream started:', data);
      setActiveStreams(prev => [...prev, {
        sessionId: data.sessionId,
        studentId: data.studentId,
        studentName: data.studentName || `Student ${data.studentId}`,
        examTitle: data.examTitle || 'Unknown Exam',
        examId: data.examId,
        startTime: data.startTime,
        riskScore: 0,
        violations: 0,
        duration: 0,
        status: 'active'
      }]);
    });

    socketRef.current.on('stream-ended', (data) => {
      console.log('🛑 Stream ended:', data);
      setActiveStreams(prev => prev.filter(s => s.sessionId !== data.sessionId));
      if (selectedStream?.sessionId === data.sessionId) {
        setSelectedStream(null);
      }
    });

    socketRef.current.on('video-frame', (data) => {
      if (selectedStream && data.sessionId === selectedStream.sessionId) {
        displayVideoFrame(data.frameData);
      }
    });

    socketRef.current.on('proctoring-violation', (data) => {
      console.log('⚠️ Proctoring violation:', data);
      updateStreamViolation(data.sessionId, data);
    });
  };

  const displayVideoFrame = (frameData) => {
    if (!videoRef.current) return;
    
    try {
      // Create a blob URL from the frame data
      const blob = new Blob([frameData], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Convert to video-compatible format
        canvas.toBlob((blob) => {
          const videoUrl = URL.createObjectURL(blob);
          if (videoRef.current) {
            videoRef.current.src = videoUrl;
          }
        });
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Error displaying video frame:', error);
    }
  };

  const updateStreamViolation = (sessionId, violationData) => {
    setActiveStreams(prev => prev.map(stream => 
      stream.sessionId === sessionId 
        ? { 
            ...stream, 
            violations: stream.violations + 1,
            riskScore: Math.min(100, stream.riskScore + 10),
            lastViolation: violationData.type
          }
        : stream
    ));
  };

  const fetchActiveStreams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/streaming/active-streams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        const streams = response.data.data || [];
        setActiveStreams(streams);
      } else {
        // Use mock data if API returns empty or invalid response
        const mockStreams = [
          {
            sessionId: 'mock_session_1',
            studentId: 1,
            studentName: 'Alice Johnson',
            examTitle: 'React Development Assessment',
            examId: 1,
            startTime: new Date(Date.now() - 15 * 60 * 1000),
            riskScore: 25,
            violations: 1,
            duration: 900,
            status: 'active',
            lastViolation: 'Multiple faces detected'
          },
          {
            sessionId: 'mock_session_2',
            studentId: 2,
            studentName: 'Bob Smith',
            examTitle: 'JavaScript Fundamentals',
            examId: 2,
            startTime: new Date(Date.now() - 8 * 60 * 1000),
            riskScore: 5,
            violations: 0,
            duration: 480,
            status: 'active'
          }
        ];
        setActiveStreams(mockStreams);
      }
    } catch (error) {
      console.error('Failed to fetch active streams:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Use mock data on error
      const mockStreams = [
        {
          sessionId: 'mock_session_1',
          studentId: 1,
          studentName: 'Alice Johnson',
          examTitle: 'React Development Assessment',
          examId: 1,
          startTime: new Date(Date.now() - 15 * 60 * 1000),
          riskScore: 25,
          violations: 1,
          duration: 900,
          status: 'active',
          lastViolation: 'Multiple faces detected'
        }
      ];
      setActiveStreams(mockStreams);
    } finally {
      setLoading(false);
    }
  };

  const updateStreamStats = () => {
    setActiveStreams(prev => prev.map(stream => ({
      ...stream,
      duration: Math.floor((Date.now() - new Date(stream.startTime).getTime()) / 1000)
    })));
  };

  const connectToStream = (stream) => {
    setSelectedStream(stream);
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('mentor-join-stream', { 
        sessionId: stream.sessionId,
        mentorId: 'current_mentor' // Replace with actual mentor ID
      });
      console.log('🔗 Joined stream:', stream.sessionId);
    }

    // Simulate video stream for demo
    if (stream.sessionId.startsWith('mock_')) {
      simulateVideoStream(stream);
    }
  };

  const simulateVideoStream = (stream) => {
    // Create a simple canvas animation to simulate video
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    let frame = 0;
    const animate = () => {
      if (selectedStream?.sessionId !== stream.sessionId) return;
      
      // Clear canvas
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw student simulation
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(200 + Math.sin(frame * 0.1) * 20, 150, 240, 180);
      
      // Draw face
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(320 + Math.sin(frame * 0.1) * 20, 220, 40, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(310 + Math.sin(frame * 0.1) * 20, 210, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(330 + Math.sin(frame * 0.1) * 20, 210, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add text
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText(`${stream.studentName} - Live Stream`, 20, 30);
      ctx.fillText(`Session: ${stream.sessionId}`, 20, 50);
      ctx.fillText(`Frame: ${frame}`, 20, 70);
      
      // Convert to image and display
      canvas.toBlob((blob) => {
        if (videoRef.current && selectedStream?.sessionId === stream.sessionId) {
          const url = URL.createObjectURL(blob);
          videoRef.current.src = url;
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      });
      
      frame++;
      setTimeout(animate, 100); // 10 FPS
    };
    
    animate();
  };

  const flagStudent = async (sessionId, reason) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/streaming/${sessionId}/flag`, { reason }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('🚩 Student flagged:', sessionId, reason);
      toast.success('Student flagged successfully');
    } catch (error) {
      console.error('Failed to flag student:', error);
      toast.error('Failed to flag student');
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/streaming/${sessionId}/terminate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSelectedStream(null);
      fetchActiveStreams();
      console.log('🛑 Session terminated:', sessionId);
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 80) return '#dc2626';
    if (riskScore >= 60) return '#ea580c';
    if (riskScore >= 40) return '#d97706';
    return '#10b981';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Live Stream Monitor">
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Loading live streams...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Live Stream Monitor">
      <div style={{ padding: '24px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Eye size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Live Stream Monitor
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '6px 12px',
              backgroundColor: isConnected ? '#10b981' : '#ef4444',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'white',
                marginRight: '8px',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {activeStreams.length} Active Streams
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: '24px' }}>
          
          {/* Stream List */}
          <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Active Exam Sessions
            </h3>
            
            {activeStreams.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                <Shield size={48} style={{ color: '#6b7280', margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>No active streams</p>
                <button 
                  onClick={fetchActiveStreams}
                  className="btn btn-primary"
                  style={{ fontSize: '12px' }}
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {activeStreams.map((stream) => (
                  <div 
                    key={stream.sessionId}
                    className="card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      border: selectedStream?.sessionId === stream.sessionId ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      backgroundColor: selectedStream?.sessionId === stream.sessionId ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => connectToStream(stream)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <User size={16} style={{ color: '#374151', marginRight: '8px' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>
                            {stream.studentName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {stream.examTitle}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getRiskColor(stream.riskScore),
                        animation: 'pulse 2s infinite'
                      }} />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      <span>Risk: {stream.riskScore}/100</span>
                      <span>Violations: {stream.violations}</span>
                      <span>{formatDuration(stream.duration)}</span>
                    </div>
                    
                    {stream.lastViolation && (
                      <div style={{
                        padding: '6px 8px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                        {stream.lastViolation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Monitor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedStream ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                      Monitoring: {selectedStream.studentName}
                    </h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                      {selectedStream.examTitle} • Session: {selectedStream.sessionId}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => flagStudent(selectedStream.sessionId, 'Flagged by mentor during live monitoring')}
                      className="btn"
                      style={{
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                    >
                      🚩 Flag Student
                    </button>
                    <button
                      onClick={() => terminateSession(selectedStream.sessionId)}
                      className="btn"
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                    >
                      🛑 Terminate
                    </button>
                  </div>
                </div>
                
                <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', flex: 1, backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', minHeight: '400px' }}>
                    <img
                      ref={videoRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000'
                      }}
                      alt="Student Stream"
                    />
                    
                    {/* Status Overlays */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(16,185,129,0.8)',
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
                        backgroundColor: `rgba(${getRiskColor(selectedStream.riskScore) === '#dc2626' ? '220,38,38' : '16,185,129'},0.8)`,
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Risk: {selectedStream.riskScore}%
                      </div>
                    </div>
                    
                    {/* Student Info */}
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
                      <div style={{ fontWeight: '600' }}>{selectedStream.studentName}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                        <Clock size={12} style={{ marginRight: '4px' }} />
                        {formatDuration(selectedStream.duration)}
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
                    Select a Stream to Monitor
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    Click on an active session from the left panel to view the student's live stream.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveStreamMonitor;