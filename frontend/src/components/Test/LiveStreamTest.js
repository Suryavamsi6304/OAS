import React, { useState } from 'react';
import { Play, Eye, Users, Activity } from 'lucide-react';
import LiveStreamMonitor from '../Mentor/LiveStreamMonitor';


const LiveStreamTest = () => {
  const [isStudentView, setIsStudentView] = useState(true);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const mockExam = {
    id: 'test_exam_1',
    title: 'Live Stream Test Exam',
    duration: 60
  };

  const handleStreamStart = (newSessionId) => {
    setSessionId(newSessionId);
    setIsStreamActive(true);
    console.log('Test stream started:', newSessionId);
  };

  const handleStreamEnd = () => {
    setSessionId(null);
    setIsStreamActive(false);
    console.log('Test stream ended');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '16px 24px',
        marginBottom: '24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
                Live Stream Test Environment
              </h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                Test the live streaming functionality between student and mentor views
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '6px 12px',
                backgroundColor: isStreamActive ? '#10b981' : '#6b7280',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Activity size={12} style={{ marginRight: '6px' }} />
                {isStreamActive ? 'Stream Active' : 'Stream Inactive'}
              </div>
              
              <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                <button
                  onClick={() => setIsStudentView(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isStudentView ? '#3b82f6' : 'transparent',
                    color: isStudentView ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Users size={14} style={{ marginRight: '6px' }} />
                  Student View
                </button>
                <button
                  onClick={() => setIsStudentView(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: !isStudentView ? '#3b82f6' : 'transparent',
                    color: !isStudentView ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Eye size={14} style={{ marginRight: '6px' }} />
                  Mentor View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {isStudentView ? (
          <div>
            {/* Student View */}
            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  Student Exam Interface
                </h2>
                <p style={{ color: '#6b7280' }}>
                  This simulates the student's view during a proctored exam with live streaming
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Play size={32} style={{ color: 'white' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    Mock Exam Environment
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    Camera streaming is active during the exam. Switch to Mentor View to see the live feed.
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Exam</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{mockExam.title}</p>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Duration</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{mockExam.duration} minutes</p>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Status</h4>
                    <p style={{ fontSize: '12px', color: isStreamActive ? '#10b981' : '#6b7280', margin: 0 }}>
                      {isStreamActive ? 'Streaming' : 'Ready'}
                    </p>
                  </div>
                </div>

                {sessionId && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#1e40af'
                  }}>
                    <strong>Session ID:</strong> {sessionId}
                  </div>
                )}
              </div>
            </div>

            {/* Camera Stream Component - Removed */}
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280' }}>Camera streaming functionality has been removed.</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Mentor View */}
            <div style={{ marginBottom: '24px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                    Mentor Live Monitoring Interface
                  </h2>
                  <p style={{ color: '#6b7280' }}>
                    Monitor active exam sessions and view live student streams
                  </p>
                </div>
              </div>
            </div>

            {/* Live Stream Monitor */}
            <div style={{ height: 'calc(100vh - 200px)' }}>
              <LiveStreamMonitor />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '300px',
        fontSize: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
          💡 How to Test
        </h4>
        <ul style={{ margin: 0, paddingLeft: '16px', color: '#6b7280', lineHeight: '1.4' }}>
          <li>Start in Student View and allow camera access</li>
          <li>Switch to Mentor View to see the live monitoring interface</li>
          <li>Click on active sessions to view simulated streams</li>
          <li>Test flagging and termination features</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveStreamTest;