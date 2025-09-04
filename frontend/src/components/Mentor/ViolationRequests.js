import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ViolationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/proctoring/logs');
      const data = await response.json();
      
      // Filter for blocked sessions with pending mentor requests
      const pendingRequests = data.filter(log => 
        log.status === 'blocked' && 
        log.mentor_request && 
        JSON.parse(log.mentor_request).status === 'pending'
      );
      
      setRequests(pendingRequests);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch violation requests:', error);
      setLoading(false);
    }
  };

  const handleRequest = async (sessionId, action, comments = '') => {
    try {
      const response = await fetch(`/api/proctoring/mentor-request/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments })
      });

      if (response.ok) {
        toast.success(`Request ${action}d successfully`);
        fetchRequests(); // Refresh the list
        setSelectedRequest(null);
      } else {
        toast.error(`Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading violation requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Violation Requests
        </h1>
        <p style={{ color: '#6b7280' }}>
          Review and approve/reject student requests after proctoring violations
        </p>
      </div>

      {requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Shield size={48} style={{ color: '#10b981', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Pending Requests
          </h3>
          <p style={{ color: '#6b7280' }}>
            All students are following exam protocols properly.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {requests.map((request) => {
            const mentorRequest = JSON.parse(request.mentor_request);
            
            return (
              <div
                key={request.session_id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <User size={16} style={{ color: '#6b7280' }} />
                      <span style={{ fontWeight: '600' }}>{request.student_name}</span>
                      <span style={{ color: '#6b7280' }}>({request.student_email})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Clock size={16} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {formatTime(mentorRequest.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                      {request.assessment_title}
                    </p>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    BLOCKED
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>Violation Details</span>
                  </div>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                    <strong>Reason:</strong> {mentorRequest.reason}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                    <span>
                      <strong>Total Violations:</strong> {mentorRequest.violations}
                    </span>
                    <span>
                      <strong>Risk Score:</strong> {mentorRequest.riskScore}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    View Details
                  </button>
                  
                  <button
                    onClick={() => handleRequest(request.session_id, 'reject')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                  
                  <button
                    onClick={() => handleRequest(request.session_id, 'approve')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              Violation Request Details
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Student:</strong> {selectedRequest.student_name}</p>
              <p><strong>Email:</strong> {selectedRequest.student_email}</p>
              <p><strong>Assessment:</strong> {selectedRequest.assessment_title}</p>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                Violation Summary
              </h3>
              {JSON.parse(selectedRequest.mentor_request) && (
                <div>
                  <p><strong>Reason:</strong> {JSON.parse(selectedRequest.mentor_request).reason}</p>
                  <p><strong>Total Violations:</strong> {JSON.parse(selectedRequest.mentor_request).violations}</p>
                  <p><strong>Risk Score:</strong> {JSON.parse(selectedRequest.mentor_request).riskScore}%</p>
                  <p><strong>Time:</strong> {formatTime(JSON.parse(selectedRequest.mentor_request).timestamp)}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              
              <button
                onClick={() => handleRequest(selectedRequest.session_id, 'reject')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <XCircle size={14} />
                Reject Request
              </button>
              
              <button
                onClick={() => handleRequest(selectedRequest.session_id, 'approve')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle size={14} />
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationRequests;