import React, { useState, useEffect } from 'react';
import { Award, Clock, BookOpen, Play, Star, TrendingUp, AlertCircle, X, Send } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SkillAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReAttemptModal, setShowReAttemptModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkillAssessments();
  }, []);

  const fetchSkillAssessments = async () => {
    try {
      const response = await api.get('/api/skill-assessments');
      setAssessments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching skill assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (assessmentId) => {
    try {
      // Check if exam can be accessed
      const response = await api.get(`/api/exams/${assessmentId}`);
      if (response.data.success) {
        window.location.href = `/learner/assessment/${assessmentId}`;
      }
    } catch (error) {
      if (error.response?.data?.requiresReAttempt) {
        // Show re-attempt modal instead of redirecting
        const exam = assessments.find(a => a.id === assessmentId);
        setSelectedExam({ id: assessmentId, title: exam?.title || 'Skill Assessment' });
        setShowReAttemptModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to access exam');
      }
    }
  };

  const submitReAttemptRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for retaking this exam');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/re-attempt/request', {
        examId: selectedExam.id,
        reason: reason.trim()
      });

      if (response.data.success) {
        toast.success('Re-attempt request sent to mentor for approval');
        setShowReAttemptModal(false);
        setReason('');
        setSelectedExam(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send re-attempt request');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowReAttemptModal(false);
    setReason('');
    setSelectedExam(null);
  };



  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[level?.toLowerCase()] || '#6b7280';
  };

  return (
    <DashboardLayout title="Skill Assessments">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Skill Assessments
          </h1>
          <p style={{ color: '#6b7280' }}>
            Test your skills and get certified in various technologies
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p>Loading skill assessments...</p>
          </div>
        ) : assessments.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {assessments.map((assessment) => (
              <div key={assessment.id} className="card" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Award size={20} style={{ color: '#f59e0b', marginRight: '8px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                      {assessment.title}
                    </h3>
                  </div>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    {assessment.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <BookOpen size={16} style={{ marginRight: '8px' }} />
                    {assessment.questionCount || 20} Questions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <Clock size={16} style={{ marginRight: '8px' }} />
                    {assessment.duration || 60} Minutes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <TrendingUp size={16} style={{ marginRight: '8px', color: getSkillLevelColor(assessment.skillLevel) }} />
                    <span style={{ color: getSkillLevelColor(assessment.skillLevel), fontWeight: '500', textTransform: 'capitalize' }}>
                      {assessment.skillLevel || 'Intermediate'}
                    </span>
                  </div>
                  {assessment.passingScore && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <Star size={16} style={{ marginRight: '8px' }} />
                      Passing Score: {assessment.passingScore}%
                    </div>
                  )}
                </div>

                <button
                  onClick={() => startAssessment(assessment.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Play size={16} style={{ marginRight: '8px' }} />
                  Start Assessment
                </button>
                
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <AlertCircle size={14} style={{ marginRight: '6px' }} />
                  Proctored • One attempt only • Re-attempts require mentor approval
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <Award size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No skill assessments available at the moment.</p>
          </div>
        )}

        {/* Re-attempt Request Modal */}
        {showReAttemptModal && selectedExam && (
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
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  Request Re-attempt
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                >
                  <X size={20} style={{ color: '#6b7280' }} />
                </button>
              </div>

              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: '500', color: '#92400e' }}>Already Attempted</span>
                </div>
                <p style={{ color: '#92400e', margin: 0, fontSize: '14px' }}>
                  You have already taken "{selectedExam.title}". To retake it, you need approval from your mentor.
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Reason for Re-attempt *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to retake this assessment..."
                  required
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
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
                  disabled={submitting || !reason.trim()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: submitting || !reason.trim() ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting || !reason.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={16} />
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SkillAssessments;