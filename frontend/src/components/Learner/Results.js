import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Results = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showReAttemptModal, setShowReAttemptModal] = useState(false);
  const [selectedResultForReAttempt, setSelectedResultForReAttempt] = useState(null);
  const [reAttemptReason, setReAttemptReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get('/api/results/student');
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = (result) => {
    const passed = result.percentage >= (result.exam?.passingScore || 70);
    return {
      text: passed ? 'Passed' : 'Failed',
      color: passed ? '#10b981' : '#ef4444',
      bgColor: passed ? '#dcfce7' : '#fef2f2'
    };
  };

  const getTestTypeInfo = (type) => {
    switch (type) {
      case 'practice':
        return { label: 'Practice Test', color: '#10b981', bgColor: '#dcfce7' };
      case 'skill-assessment':
        return { label: 'Skill Assessment', color: '#3b82f6', bgColor: '#dbeafe' };
      default:
        return { label: 'Exam', color: '#f59e0b', bgColor: '#fef3c7' };
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const retakeTest = (examId) => {
    navigate(`/learner/exam/${examId}/instructions`);
  };

  const requestReAttempt = (result) => {
    setSelectedResultForReAttempt(result);
    setShowReAttemptModal(true);
    setReAttemptReason('');
  };

  const submitReAttemptRequest = async () => {
    if (!reAttemptReason.trim()) {
      toast.error('Please provide a reason for re-attempt');
      return;
    }

    setSubmittingRequest(true);
    try {
      await axios.post('/api/re-attempt/request', {
        resultId: selectedResultForReAttempt.id,
        reason: reAttemptReason
      });
      
      toast.success('Re-attempt request submitted successfully');
      setShowReAttemptModal(false);
      setSelectedResultForReAttempt(null);
      setReAttemptReason('');
      fetchResults(); // Refresh results
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const canRequestReAttempt = (result) => {
    const failed = result.percentage < (result.exam?.passingScore || 60);
    const isExam = result.exam?.type === 'exam' || result.exam?.type === 'skill-assessment';
    // Check if this is already a re-attempt result
    const isReAttempt = result.exam?.title?.includes('(Re-attempt)') || result.status === 'reviewed';
    return failed && isExam && !isReAttempt;
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
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
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
            My Test Results
          </h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
            View your performance across all completed tests
          </p>
        </div>

        {results.length === 0 ? (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '60px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Target size={48} style={{ color: '#6b7280', margin: '0 auto 16px', opacity: 0.5 }} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
              No Results Yet
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              You haven't completed any tests yet. Start taking tests to see your results here.
            </p>
            <button
              onClick={() => navigate('/learner')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Browse Available Tests
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {results.map((result) => {
              const statusBadge = getStatusBadge(result);
              const testTypeInfo = getTestTypeInfo(result.exam?.type);
              const scoreColor = getScoreColor(result.percentage);
              
              return (
                <div 
                  key={result.id} 
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '24px', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                >
                  {/* Header */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        margin: 0, 
                        color: '#1f2937',
                        flex: 1,
                        paddingRight: '12px'
                      }}>
                        {result.exam?.title || 'Test'}
                      </h3>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: testTypeInfo.bgColor,
                        color: testTypeInfo.color,
                        whiteSpace: 'nowrap'
                      }}>
                        {testTypeInfo.label}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} style={{ color: '#6b7280' }} />
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(result.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
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
                        marginBottom: '4px'
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
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: statusBadge.bgColor,
                        color: statusBadge.color
                      }}>
                        {statusBadge.text === 'Passed' ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {statusBadge.text}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <Clock size={14} />
                      <span>Time: {formatTime(result.timeSpent || 0)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <Target size={14} />
                      <span>Questions: {result.answers?.length || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {result.exam?.type === 'practice' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retakeTest(result.examId);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <RotateCcw size={14} />
                        Retake Test
                      </button>
                    )}
                    
                    {canRequestReAttempt(result) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestReAttempt(result);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <RefreshCw size={14} />
                        Request Re-attempt
                      </button>
                    )}
                  </div>

                  {/* Detailed Results (Expandable) */}
                  {selectedResult?.id === result.id && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1f2937' }}>
                        Question-wise Results
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {result.answers?.map((answer, index) => (
                          <div 
                            key={index}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          >
                            <span>Question {index + 1}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {answer.isCorrect ? (
                                <CheckCircle size={14} style={{ color: '#10b981' }} />
                              ) : answer.needsReview ? (
                                <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                              ) : (
                                <XCircle size={14} style={{ color: '#ef4444' }} />
                              )}
                              <span style={{ 
                                color: answer.isCorrect ? '#10b981' : answer.needsReview ? '#f59e0b' : '#ef4444',
                                fontWeight: '500'
                              }}>
                                {answer.isCorrect ? 'Correct' : answer.needsReview ? 'Under Review' : 'Incorrect'}
                              </span>
                              <span style={{ color: '#6b7280' }}>
                                {answer.points} pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
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
                You are requesting a re-attempt for: <strong>{selectedResultForReAttempt?.exam?.title}</strong>
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
                    setSelectedResultForReAttempt(null);
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

export default Results;