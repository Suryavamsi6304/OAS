import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExamResult = () => {
  const { examId } = useParams();
  const { } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReAttemptModal, setShowReAttemptModal] = useState(false);
  const [reAttemptReason, setReAttemptReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [examId, navigate]);

  const fetchResult = async () => {
    try {
      const response = await axios.get('/api/results/student');
      const results = response.data.data || [];
      const examResult = results.find(r => r.examId === parseInt(examId));
      
      if (!examResult) {
        toast.error('Result not found');
        navigate('/learner');
        return;
      }
      
      setResult(examResult);
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error('Failed to load result');
      navigate('/learner');
    } finally {
      setLoading(false);
    }
  };

  const submitReAttemptRequest = async () => {
    if (!reAttemptReason.trim()) {
      toast.error('Please provide a reason for re-attempt');
      return;
    }

    setSubmittingRequest(true);
    try {
      await axios.post('/api/re-attempt/request', {
        resultId: result.id,
        reason: reAttemptReason
      });
      
      toast.success('Re-attempt request submitted successfully');
      setShowReAttemptModal(false);
      setReAttemptReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const canRequestReAttempt = () => {
    if (!result) return false;
    const failed = result.percentage < (result.exam?.passingScore || 60);
    const isExam = result.exam?.type === 'exam' || result.exam?.type === 'skill-assessment';
    // Check if this is already a re-attempt result (second attempt)
    const isReAttempt = result.exam?.title?.includes('(Re-attempt)') || result.status === 'reviewed';
    return failed && isExam && !isReAttempt;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = () => {
    if (!result) return { text: 'Unknown', color: '#6b7280', bgColor: '#f3f4f6' };
    const passed = result.percentage >= (result.exam?.passingScore || 60);
    return {
      text: passed ? 'Passed' : 'Failed',
      color: passed ? '#10b981' : '#ef4444',
      bgColor: passed ? '#dcfce7' : '#fef2f2'
    };
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1>Result Not Found</h1>
          <button onClick={() => navigate('/learner')} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge();
  const scoreColor = getScoreColor(result.percentage);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/learner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
            Exam Result
          </h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
            {result.exam?.title}
          </p>
        </div>

        {/* Result Card */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}>
          {/* Exam Info */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
              {result.exam?.title}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {result.exam?.description}
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {new Date(result.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Time: {Math.floor((result.timeSpent || 0) / 60)}m {(result.timeSpent || 0) % 60}s
                </span>
              </div>
            </div>
          </div>

          {/* Score Display */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: scoreColor,
                marginBottom: '6px'
              }}>
                {result.percentage}%
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {result.score} / {result.totalPoints} points
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: statusBadge.bgColor,
                color: statusBadge.color
              }}>
                {statusBadge.text === 'Passed' ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                {statusBadge.text}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canRequestReAttempt() && (
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setShowReAttemptModal(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={16} />
                Request Re-attempt
              </button>
            </div>
          )}

          {/* Question-wise Results */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1f2937' }}>
              Question Results ({result.answers?.length || 0} questions)
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '8px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px'
            }}>
              {result.answers?.map((answer, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: `2px solid ${answer.isCorrect ? '#10b981' : answer.needsReview ? '#f59e0b' : '#ef4444'}`,
                    fontSize: '12px'
                  }}
                >
                  <span style={{ fontWeight: '500', marginBottom: '4px' }}>Q{index + 1}</span>
                  {answer.isCorrect ? (
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                  ) : answer.needsReview ? (
                    <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                  ) : (
                    <XCircle size={14} style={{ color: '#ef4444' }} />
                  )}
                  <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                    {answer.points}pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Re-attempt Request Modal */}
        {showReAttemptModal && (
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
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                Request Re-attempt
              </h3>
              
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                You are requesting a re-attempt for: <strong>{result.exam?.title}</strong>
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                  Reason for re-attempt request *
                </label>
                <textarea
                  value={reAttemptReason}
                  onChange={(e) => setReAttemptReason(e.target.value)}
                  placeholder="Please explain why you need a re-attempt..."
                  rows={4}
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
                    setShowReAttemptModal(false);
                    setReAttemptReason('');
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
                  onClick={submitReAttemptRequest}
                  disabled={submittingRequest || !reAttemptReason.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: submittingRequest || !reAttemptReason.trim() ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submittingRequest || !reAttemptReason.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submittingRequest && (
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResult;