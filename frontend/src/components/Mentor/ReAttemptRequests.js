import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, FileText, Calendar } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../contexts/NotificationContext';

const ReAttemptRequests = () => {
  const { socket } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    
    // Listen for real-time updates
    if (socket) {
      socket.on('new-reattempt-request', (data) => {
        // Refresh requests when new request received
        fetchRequests();
      });
      
      return () => {
        socket.off('new-reattempt-request');
      };
    }
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/re-attempt/requests');
      setRequests(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load re-attempt requests');
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async (requestId, status) => {
    setSubmitting(true);
    try {
      const response = await api.put(`/api/re-attempt/requests/${requestId}/review`, {
        status,
        comment: reviewComment
      });
      
      toast.success(`Request ${status} successfully`);
      
      // Emit real-time notification to student
      if (socket && response.data.data) {
        socket.emit('reattempt-response', {
          studentId: response.data.data.studentId,
          examId: response.data.data.examId,
          examTitle: response.data.data.examTitle,
          status: status,
          comment: reviewComment
        });
      }
      
      setSelectedRequest(null);
      setReviewComment('');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#f59e0b', text: 'Pending' },
      approved: { bg: '#dcfce7', color: '#10b981', text: 'Approved' },
      rejected: { bg: '#fef2f2', color: '#ef4444', text: 'Rejected' }
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
        Re-attempt Requests
      </h2>

      {requests.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '60px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <Clock size={48} style={{ color: '#6b7280', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            No Requests
          </h3>
          <p style={{ color: '#6b7280' }}>
            No re-attempt requests at the moment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {requests.map((request) => {
            const statusBadge = getStatusBadge(request.status);
            
            return (
              <div 
                key={request.id}
                style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
                      {request.exam?.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {request.student?.name} ({request.student?.username})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Score:</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#ef4444' }}>
                        {request.result?.percentage}% ({request.result?.score} points)
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color
                  }}>
                    {statusBadge.text}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <FileText size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Reason:</span>
                  </div>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    margin: 0
                  }}>
                    {request.reason}
                  </p>
                </div>

                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Review Request
                    </button>
                  </div>
                )}

                {request.reviewComment && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>Review Comment:</span>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                      {request.reviewComment}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
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
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
              Review Re-attempt Request
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Student:</strong> {selectedRequest.student?.name}</p>
              <p><strong>Exam:</strong> {selectedRequest.exam?.title}</p>
              <p><strong>Score:</strong> {selectedRequest.result?.percentage}%</p>
              <p><strong>Reason:</strong></p>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '6px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {selectedRequest.reason}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                Review Comment (Optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment for your decision..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewComment('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => reviewRequest(selectedRequest.id, 'rejected')}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: submitting ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => reviewRequest(selectedRequest.id, 'approved')}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: submitting ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={14} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReAttemptRequests;