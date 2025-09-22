import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const BlockedExamApprovals = () => {
  const [blockedExams, setBlockedExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedExams();
  }, []);

  const fetchBlockedExams = async () => {
    try {
      const response = await api.get('/api/blocked-exams');
      setBlockedExams(response.data.data || []);
    } catch (error) {
      console.error('Error fetching blocked exams:', error);
      toast.error('Failed to load blocked exams');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (blockedExamId) => {
    try {
      await api.put(`/api/blocked-exams/${blockedExamId}/approve`);
      toast.success('Exam approved successfully');
      fetchBlockedExams(); // Refresh list
    } catch (error) {
      console.error('Error approving exam:', error);
      toast.error('Failed to approve exam');
    }
  };

  const handleTerminate = async (blockedExamId) => {
    if (!window.confirm('Are you sure you want to terminate this exam? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/api/blocked-exams/${blockedExamId}/terminate`);
      toast.success('Exam terminated successfully');
      fetchBlockedExams(); // Refresh list
    } catch (error) {
      console.error('Error terminating exam:', error);
      toast.error('Failed to terminate exam');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p>Loading blocked exams...</p>
      </div>
    );
  }

  if (blockedExams.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>No pending approval requests.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {blockedExams.map((blockedExam) => (
        <div key={blockedExam.id} style={{
          padding: '20px',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          backgroundColor: '#fef2f2'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <User size={16} style={{ color: '#dc2626' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#dc2626' }}>
                  {blockedExam.student?.name}
                </h4>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BookOpen size={16} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  {blockedExam.exam?.title}
                </span>
              </div>
              
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0' }}>
                <strong>Reason:</strong> {blockedExam.reason}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Blocked: {new Date(blockedExam.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleApprove(blockedExam.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <CheckCircle size={16} />
                Approve
              </button>
              <button
                onClick={() => handleTerminate(blockedExam.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <XCircle size={16} />
                Terminate
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlockedExamApprovals;