import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Clock, Award, Play, Eye, User, LogOut, Code, Target, TrendingUp, Download, Trophy, RefreshCw, FileText, Video } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';
import Leaderboard from './Leaderboard';

import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const EnhancedLearnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [skillAssessments, setSkillAssessments] = useState([]);
  const [reAttemptRequests, setReAttemptRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('learnerActiveTab') || 'dashboard';
  });
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [meetingNotification, setMeetingNotification] = useState(null);

  useEffect(() => {
    fetchData();
    const cleanup = setupMeetingNotifications();
    
    return cleanup;
  }, [user?.batchCode]);

  const setupMeetingNotifications = () => {
    const socket = io('http://localhost:3001');
    
    socket.on('meeting-started', (data) => {
      if (data.batch === user?.batchCode) {
        setMeetingNotification(data);
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontWeight: '600' }}>Meeting Started!</div>
              <div style={{ fontSize: '12px' }}>{data.message}</div>
            </div>
          </div>,
          { duration: 8000 }
        );
      }
    });
    
    socket.on('meeting-ended', (data) => {
      if (data.batch === user?.batchCode) {
        setMeetingNotification(null); // Clear notification immediately
      }
    });
    
    // Return cleanup function
    return () => {
      socket.disconnect();
    };
  };

  const fetchData = async () => {
    try {
      const [examsRes, resultsRes, practiceRes, skillRes, requestsRes] = await Promise.all([
        axios.get('/api/exams'),
        axios.get('/api/results/student'),
        axios.get('/api/practice-tests'),
        axios.get('/api/skill-assessments'),
        axios.get('/api/re-attempt/my-requests').catch(() => ({ data: { data: [] } }))
      ]);
      
      setExams(examsRes.data.data || []);
      setResults(resultsRes.data.data || []);
      setPracticeTests(practiceRes.data.data || []);
      setSkillAssessments(skillRes.data.data || []);
      setReAttemptRequests(requestsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalExams: exams.length,
    completedExams: results.length,
    averageScore: results.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0,
    pendingExams: exams.length - results.length,
    certificatesEarned: results.filter(r => r.percentage >= 70).length,
    totalTimeSpent: results.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
  };



  const certificates = results.filter(r => r.percentage >= 70).map(r => ({
    id: r.id,
    title: r.exam?.title || 'Assessment',
    score: r.percentage,
    date: new Date(r.createdAt).toLocaleDateString(),
    certificateId: `CERT-${r.id}`
  }));

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
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div>
      {/* Enhanced Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <BookOpen size={28} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.totalExams}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Available Exams</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Award size={28} style={{ color: '#10b981', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.completedExams}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Completed</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <TrendingUp size={28} style={{ color: '#f59e0b', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.averageScore}%</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Average Score</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Trophy size={28} style={{ color: '#8b5cf6', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.certificatesEarned}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Certificates</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Clock size={28} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{Math.floor(stats.totalTimeSpent / 60)}h</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Time Spent</p>
        </div>
      </div>

      {/* Available Exams */}
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>Available Assessments</h2>
          <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '16px', margin: 0 }}>Choose an assessment to test your knowledge and skills</p>
          
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[
              { id: 'all', label: 'All Assessments', icon: '📋' },
              { id: 'practice', label: 'Practice Tests', icon: '🎯' },
              { id: 'skill-assessment', label: 'Skill Assessments', icon: '⚡' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setAssessmentFilter(filter.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: assessmentFilter === filter.id ? '#3b82f6' : '#f1f5f9',
                  color: assessmentFilter === filter.id ? 'white' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {exams.filter(exam => {
            const isCompleted = results.some(r => r.examId === exam.id);
            const canRetake = exam.type === 'practice';
            
            // Fix type matching logic
            let typeMatch = false;
            if (assessmentFilter === 'all') {
              typeMatch = true;
            } else if (assessmentFilter === 'practice') {
              typeMatch = exam.type === 'practice';
            } else if (assessmentFilter === 'skill-assessment') {
              typeMatch = exam.type === 'skill-assessment';
            }
            
            return (!isCompleted || canRetake) && typeMatch;
          }).map((exam) => {
            const isCompleted = results.some(r => r.examId === exam.id);
            const canRetake = exam.type === 'practice';
            const typeConfig = {
              practice: { bg: '#ecfdf5', color: '#059669', icon: '🎯', label: 'Practice' },
              'skill-assessment': { bg: '#eff6ff', color: '#2563eb', icon: '⚡', label: 'Skill Test' },
              default: { bg: '#fef3c7', color: '#d97706', icon: '📝', label: 'Exam' }
            };
            const config = typeConfig[exam.type] || typeConfig.default;
            
            return (
              <div key={exam.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = config.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}>
                
                {/* Compact Header */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: '#0f172a', lineHeight: '1.3', flex: 1, paddingRight: '8px' }}>
                      {exam.title}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      backgroundColor: config.bg,
                      color: config.color,
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '10px' }}>{config.icon}</span>
                      {config.label}
                    </div>
                  </div>
                  {exam.description && (
                    <p style={{ color: '#64748b', margin: 0, fontSize: '12px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {exam.description}
                    </p>
                  )}
                </div>
                
                {/* Ultra Compact Stats */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '11px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6b7280' }}>
                    <Clock size={12} style={{ color: '#2563eb' }} />
                    {exam.duration}min
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6b7280' }}>
                    <BookOpen size={12} style={{ color: '#059669' }} />
                    {exam.questions?.length || 0}Q
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6b7280' }}>
                    <Award size={12} style={{ color: '#d97706' }} />
                    {exam.totalPoints || 0}pts
                  </span>
                  {exam.passingScore && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6b7280' }}>
                      <Target size={12} style={{ color: '#7c3aed' }} />
                      {exam.passingScore}%
                    </span>
                  )}
                </div>
                
                {/* Compact Status Indicators */}
                <div style={{ marginBottom: '8px' }}>
                  {exam.negativeMarking && (
                    <div style={{ 
                      padding: '4px 6px', 
                      backgroundColor: '#fef2f2', 
                      borderRadius: '4px', 
                      marginBottom: '4px',
                      fontSize: '10px', 
                      color: '#dc2626', 
                      fontWeight: '500'
                    }}>
                      ⚠️ Negative marking
                    </div>
                  )}
                  
                  {isCompleted && canRetake && (
                    <div style={{ 
                      padding: '4px 6px', 
                      backgroundColor: '#f0fdf4', 
                      borderRadius: '4px', 
                      fontSize: '10px', 
                      color: '#059669', 
                      fontWeight: '500'
                    }}>
                      ✅ Retake available
                    </div>
                  )}
                </div>
                
                {/* Compact Action Button */}
                <button
                  onClick={() => navigate(`/learner/exam/${exam.id}/instructions`)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: isCompleted && canRetake ? '#059669' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isCompleted && canRetake ? '#047857' : '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isCompleted && canRetake ? '#059669' : '#3b82f6';
                  }}
                >
                  <Play size={14} />
                  {isCompleted && canRetake ? 'Retake' : 'Start'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPracticeTests = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Practice Tests</h2>
      
      {practiceTests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No practice tests available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {practiceTests.map((test) => {
            const isCompleted = results.some(r => r.examId === test.id);
            const result = results.find(r => r.examId === test.id);
            
            return (
              <div key={test.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{test.title}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#dcfce7',
                      color: '#166534'
                    }}>
                      Practice
                    </span>
                  </div>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '16px', lineHeight: '1.5' }}>{test.description}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{test.duration} minutes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{test.questions?.length || 0} questions</span>
                  </div>
                  {test.totalPoints && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{test.totalPoints} points</span>
                    </div>
                  )}
                </div>
                
                {isCompleted && (
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#f0fdf4', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>✅ Last Score:</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>{result?.percentage}%</span>
                  </div>
                )}
                
                <button
                  onClick={() => navigate(`/learner/exam/${test.id}/instructions`)}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isCompleted ? '#059669' : '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isCompleted ? '#10b981' : '#3b82f6';
                  }}
                >
                  <Play size={18} />
                  {isCompleted ? 'Retake Practice' : 'Start Practice'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSkillAssessment = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Skill Assessments</h2>
      
      {skillAssessments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <Code size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No skill assessments available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {skillAssessments.map((assessment) => {
            const isCompleted = results.some(r => r.examId === assessment.id);
            const result = results.find(r => r.examId === assessment.id);
            
            return (
              <div key={assessment.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Code size={24} style={{ color: '#10b981' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{assessment.title}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af'
                    }}>
                      Skill Test
                    </span>
                  </div>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '16px', lineHeight: '1.5' }}>{assessment.description}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{assessment.duration} minutes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{assessment.questions?.length || 0} questions</span>
                  </div>
                  {assessment.totalPoints && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{assessment.totalPoints} points</span>
                    </div>
                  )}
                  {assessment.passingScore && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={18} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{assessment.passingScore}% to pass</span>
                    </div>
                  )}
                </div>
                
                {isCompleted && (
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: result?.percentage >= 70 ? '#f0fdf4' : '#fef2f2', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: `1px solid ${result?.percentage >= 70 ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '14px', color: result?.percentage >= 70 ? '#166534' : '#dc2626', fontWeight: '500' }}>
                      {result?.percentage >= 70 ? '✅ Passed' : '❌ Failed'} - Last Score:
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: result?.percentage >= 70 ? '#166534' : '#dc2626' }}>
                      {result?.percentage}%
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => navigate(`/learner/exam/${assessment.id}/instructions`)}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isCompleted ? '#059669' : '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isCompleted ? '#10b981' : '#3b82f6';
                  }}
                >
                  <Code size={18} />
                  {isCompleted ? 'Reassess Skill' : 'Start Assessment'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCertificates = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Certificates</h2>
      
      {certificates.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {certificates.map((cert) => (
            <div key={cert.id} style={{ 
              padding: '20px', 
              border: '2px solid #f59e0b', 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Award size={24} style={{ color: '#f59e0b', marginRight: '8px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{cert.title}</h3>
              </div>
              
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#92400e' }}>
                <p style={{ margin: '4px 0' }}>Score: {cert.score}%</p>
                <p style={{ margin: '4px 0' }}>Date: {cert.date}</p>
                <p style={{ margin: '4px 0' }}>ID: {cert.certificateId}</p>
              </div>
              
              <button
                onClick={() => toast.success(`Certificate downloaded!`)}
                style={{
                  width: '100%',
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
                <Download size={16} />
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <Award size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No certificates earned yet. Complete exams with 70% or higher to earn certificates!</p>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>Exam Results</h2>
        <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>Track your performance and progress across all assessments</p>
      </div>
      
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            <FileText size={40} style={{ color: '#94a3b8' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>No Results Yet</h3>
          <p style={{ fontSize: '14px', margin: 0 }}>Take some exams to see your results and track your progress!</p>
        </div>
      ) : (
        <div>
          {/* Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px', 
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
                {results.length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Total Attempts</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                {results.filter(r => r.percentage >= 70).length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Passed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
                {stats.averageScore}%
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Avg Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>
                {Math.floor(stats.totalTimeSpent / 60)}h
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Time Spent</div>
            </div>
          </div>

          {/* Results Cards - Compact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', overflow: 'hidden' }}>
            {results.map((result) => {
              const exam = exams.find(e => e.id === result.examId) || result.exam;
              const isPassed = result.percentage >= (exam?.passingScore || 70);
              const typeConfig = {
                practice: { bg: '#ecfdf5', color: '#059669', icon: '🎯', label: 'Practice' },
                'skill-assessment': { bg: '#eff6ff', color: '#2563eb', icon: '⚡', label: 'Skill Test' },
                default: { bg: '#fef3c7', color: '#d97706', icon: '📝', label: 'Exam' }
              };
              const config = typeConfig[exam?.type] || typeConfig.default;
              
              return (
                <div key={result.id} style={{ 
                  backgroundColor: 'white',
                  border: `1px solid ${isPassed ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                  minWidth: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}>
                  
                  {/* Exam Info */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exam?.title || 'Unknown Exam'}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '9px',
                        fontWeight: '600',
                        backgroundColor: config.bg,
                        color: config.color
                      }}>
                        <span>{config.icon}</span>
                        {config.label}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(result.createdAt).toLocaleDateString()} • {Math.floor((result.timeSpent || 0) / 60)}m {(result.timeSpent || 0) % 60}s
                    </div>
                  </div>
                  
                  {/* Score & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: isPassed ? '#10b981' : '#ef4444' }}>
                        {result.percentage}%
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        {result.score}/{result.totalPoints}
                      </div>
                    </div>
                    
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      backgroundColor: isPassed ? '#dcfce7' : '#fee2e2',
                      color: isPassed ? '#166534' : '#991b1b'
                    }}>
                      {isPassed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => navigate(`/learner/results/${result.examId}`)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={12} />
                      View
                    </button>
                    
                    {!isPassed && exam?.type !== 'practice' && (
                      <button
                        onClick={() => {
                          const hasRequest = reAttemptRequests.some(r => r.examId === result.examId);
                          if (hasRequest) {
                            navigate('/learner/re-attempts');
                          } else {
                            navigate(`/learner/results/${result.examId}`);
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RefreshCw size={12} />
                        Re-attempt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Performance Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Score Trend</h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'end', justifyContent: 'space-around', backgroundColor: '#f8fafc', borderRadius: '6px', padding: '20px' }}>
            {results.slice(-5).map((result, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '30px',
                  height: `${result.percentage * 1.5}px`,
                  backgroundColor: result.percentage >= 70 ? '#10b981' : '#ef4444',
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '8px'
                }} />
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{result.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.slice(0, 3).map((result) => (
              <div key={result.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: result.percentage >= 70 ? '#10b981' : '#ef4444',
                  marginRight: '12px'
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{result.exam?.title}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{new Date(result.createdAt).toLocaleDateString()}</p>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: result.percentage >= 70 ? '#10b981' : '#ef4444' }}>
                  {result.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        opacity: 0.1,
        zIndex: 0
      }} />
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
              Assessment Platform
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Welcome back, {user?.name}!</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} style={{ color: '#6b7280' }} />
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{user?.username}</span>
              {user?.batchCode && (
                <span style={{ 
                  padding: '6px 12px', 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  borderRadius: '5px', 
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {user.batchCode}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/communication')}
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
              <BookOpen size={16} />
              Meeting
            </button>
            <button
              onClick={() => navigate('/learner/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <User size={16} />
              Profile
            </button>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        position: 'relative',
        zIndex: 20
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 21 }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'practice', label: 'Practice Tests', icon: Target },
              { id: 'skills', label: 'Skill Assessment', icon: Code },
              { id: 'results', label: 'Results', icon: FileText },
              { id: 'certificates', label: 'Certificates', icon: Award },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 're-attempts', label: 'Re-attempts', icon: RefreshCw }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    localStorage.setItem('learnerActiveTab', tab.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 0',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    pointerEvents: 'auto',
                    outline: 'none'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px',
        position: 'relative',
        zIndex: 5
      }}>

        
        {/* Meeting Notification */}
        {meetingNotification && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Video size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0', color: '#10b981' }}>
                  📹 Meeting Started!
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                  {meetingNotification.mentorName} has started: {meetingNotification.title}
                </p>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Batch: {meetingNotification.batch}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setMeetingNotification(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    navigate(`/meeting/${meetingNotification.meetingId}`);
                    setMeetingNotification(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Video size={16} />
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'practice' && renderPracticeTests()}
        {activeTab === 'skills' && renderSkillAssessment()}
        {activeTab === 'results' && renderResults()}
        {activeTab === 'certificates' && renderCertificates()}
        {activeTab === 'analytics' && renderAnalytics()}

        

        
        {activeTab === 're-attempts' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Re-attempt Exams</h2>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {/* Approved Re-attempts */}
              {reAttemptRequests.filter(r => r.status === 'approved').map((request) => {
                const exam = exams.find(e => e.id === request.examId);
                if (!exam) return null;
                
                return (
                  <div key={request.id} style={{ 
                    padding: '20px', 
                    border: '2px solid #10b981', 
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{exam.title}</h3>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                          Re-attempt approved on {new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ 
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: '#dcfce7',
                        color: '#166534'
                      }}>
                        Approved
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                      <span>⏱️ {exam.duration}min</span>
                      <span>❓ {exam.questions?.length || 0} questions</span>
                      <span>🏆 {exam.totalPoints || 0} points</span>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/learner/exam/${exam.id}/instructions`)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Play size={16} />
                      Start Re-attempt
                    </button>
                  </div>
                );
              })}
              
              {/* Link to full re-attempts page */}
              <div style={{ 
                padding: '20px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: '#f8fafc'
              }}>
                <RefreshCw size={32} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>View All Re-attempt Requests</h3>
                <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>Track pending, approved, and rejected requests</p>
                <button
                  onClick={() => navigate('/learner/re-attempts')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  View All Requests
                </button>
              </div>
            </div>
            
            {reAttemptRequests.filter(r => r.status === 'approved').length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <RefreshCw size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No approved re-attempts available. Request re-attempts for failed exams from the results page.</p>
              </div>
            )}
          </div>
        )}
        

      </div>
    </div>
  );
};

export default EnhancedLearnerDashboard;