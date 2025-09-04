import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNotifications } from '../../contexts/NotificationContext';

const ReAttempts = () => {
  const navigate = useNavigate();
  const { socket } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [failedExams, setFailedExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReAttemptRequests();
    fetchFailedExams();
    
    // Listen for real-time updates
    if (socket) {
      socket.on('reattempt-response', (data) => {
        // Refresh requests when response received
        fetchReAttemptRequests();
      });
      
      return () => {
        socket.off('reattempt-response');
      };
    }
  }, [socket]);

  const fetchReAttemptRequests = async () => {
    try {
      const response = await axios.get('/api/re-attempt/my-requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching re-attempt requests:', error);
      toast.error('Failed to load re-attempt requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchFailedExams = async () => {
    try {
      const response = await axios.get('/api/results/failed-skill-assessments');
      setFailedExams(response.data.data || []);
    } catch (error) {
      console.error('Error fetching failed exams:', error);
    }
  };

  const createReAttemptRequest = async () => {
    if (!selectedExam || !reason.trim()) {
      toast.error('Please select an exam and provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/re-attempt/request', {
        examId: selectedExam,
        reason: reason.trim()
      });

      if (response.data.success) {
        toast.success('Re-attempt request submitted successfully!');
        setShowCreateModal(false);
        setSelectedExam('');
        setReason('');
        fetchReAttemptRequests();
        
        // Emit real-time notification to mentors
        if (socket) {
          socket.emit('new-reattempt-request', {
            requestId: response.data.data.id,
            studentId: response.data.data.studentId,
            studentName: response.data.data.studentName,
            examId: selectedExam,
            examTitle: response.data.data.examTitle,
            reason: reason.trim()
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} style={{ color: '#10b981' }} />;
      case 'rejected':
        return <XCircle size={20} style={{ color: '#ef4444' }} />;
      default:
        return <Clock size={20} style={{ color: '#f59e0b' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', margin: '0 auto 16px' }} />
          <p>Loading re-attempt requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/learner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Re-attempt Requests</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Track your exam re-attempt requests</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Create Request Button */}
        {failedExams.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Plus size={16} />
              Request Re-attempt
            </button>
          </div>
        )}
        {requests.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <RefreshCw size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#374151' }}>No Re-attempt Requests</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>You haven't requested any exam re-attempts yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((request) => (
              <div key={request.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>{request.exam?.title}</h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                      Requested on {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(request.status)}
                    <span style={{ 
                      color: getStatusColor(request.status), 
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {request.status}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#374151' }}>Reason for Re-attempt:</h4>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '14px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                    {request.reason}
                  </p>
                </div>

                {request.reviewComment && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#374151' }}>Review Comment:</h4>
                    <p style={{ 
                      color: '#6b7280', 
                      margin: 0, 
                      fontSize: '14px', 
                      backgroundColor: request.status === 'approved' ? '#f0fdf4' : '#fef2f2', 
                      padding: '12px', 
                      borderRadius: '6px',
                      border: `1px solid ${request.status === 'approved' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      {request.reviewComment}
                    </p>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '6px', 
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                    <span style={{ color: '#065f46', fontSize: '14px', fontWeight: '500' }}>
                      Your re-attempt has been approved! You can now retake this exam.
                    </span>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div style={{ 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '6px', 
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <XCircle size={16} style={{ color: '#ef4444' }} />
                    <span style={{ color: '#991b1b', fontSize: '14px', fontWeight: '500' }}>
                      Your re-attempt request has been rejected.
                    </span>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div style={{ 
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fed7aa', 
                    borderRadius: '6px', 
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ color: '#92400e', fontSize: '14px', fontWeight: '500' }}>
                      Your request is pending review by the mentor.
                    </span>
                  </div>
                )}

                <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af' }}>
                  {request.reviewedAt && (
                    <span>Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Create Request Modal */}
        {showCreateModal && (
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
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Request Re-attempt</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Select Failed Exam:</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose an exam...</option>
                  {failedExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} - Score: {exam.percentage}%
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Reason for Re-attempt:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need a re-attempt..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
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
                    setShowCreateModal(false);
                    setSelectedExam('');
                    setReason('');
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
                  onClick={createReAttemptRequest}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReAttempts;