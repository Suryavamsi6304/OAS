import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Clock, Award, Play, Eye, User, LogOut, Code, Target, TrendingUp, Calendar, Download, Star, Trophy, Zap, RefreshCw, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EnhancedLearnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [skillAssessments, setSkillAssessments] = useState([]);
  const [reAttemptRequests, setReAttemptRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, resultsRes, practiceRes, skillRes, requestsRes] = await Promise.all([
        axios.get('/api/exams'),
        axios.get('/api/results/student'),
        axios.get('/api/practice-tests'),
        axios.get('/api/skills/assessment'),
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
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Available Assessments</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {exams.filter(exam => {
            const isCompleted = results.some(r => r.examId === exam.id);
            const canRetake = exam.type === 'practice';
            return !isCompleted || canRetake;
          }).map((exam) => {
            const isCompleted = results.some(r => r.examId === exam.id);
            const canRetake = exam.type === 'practice';
            
            return (
              <div key={exam.id} style={{ 
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
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{exam.title}</h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: exam.type === 'practice' ? '#dcfce7' : exam.type === 'skill-assessment' ? '#dbeafe' : '#fef3c7',
                      color: exam.type === 'practice' ? '#166534' : exam.type === 'skill-assessment' ? '#1e40af' : '#92400e'
                    }}>
                      {exam.type === 'practice' ? 'Practice' : exam.type === 'skill-assessment' ? 'Skill Test' : 'Assessment'}
                    </span>
                  </div>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '16px', lineHeight: '1.5' }}>{exam.description}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{exam.duration} minutes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{exam.questions?.length || 0} questions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{exam.totalPoints || 0} points</span>
                  </div>
                  {exam.passingScore && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={18} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{exam.passingScore}% to pass</span>
                    </div>
                  )}
                </div>
                
                {exam.negativeMarking && (
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#fef2f2', 
                    borderRadius: '6px', 
                    marginBottom: '16px',
                    border: '1px solid #fecaca'
                  }}>
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
                      ⚠️ Negative marking: -{exam.negativeMarkingValue} points per wrong answer
                    </span>
                  </div>
                )}
                
                {isCompleted && canRetake && (
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#f0fdf4', 
                    borderRadius: '6px', 
                    marginBottom: '16px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>
                      ✅ Previously completed - You can retake this practice test
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => navigate(`/learner/exam/${exam.id}/instructions`)}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    backgroundColor: isCompleted && canRetake ? '#10b981' : '#3b82f6',
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
                    e.target.style.backgroundColor = isCompleted && canRetake ? '#059669' : '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isCompleted && canRetake ? '#10b981' : '#3b82f6';
                  }}
                >
                  <Play size={18} />
                  {isCompleted && canRetake ? 'Retake Practice Test' : 'Start Assessment'}
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
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Exam Results</h2>
      
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No exam results yet. Take some exams to see your results here!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151' }}>Exam</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: '600', color: '#374151' }}>Score</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: '600', color: '#374151' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: '600', color: '#374151' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: '600', color: '#374151' }}>Time</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: '600', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const exam = exams.find(e => e.id === result.examId) || result.exam;
                const isPassed = result.percentage >= (exam?.passingScore || 70);
                
                return (
                  <tr key={result.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                          {exam?.title || 'Unknown Exam'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {exam?.type === 'practice' ? 'Practice Test' : 
                           exam?.type === 'skill-assessment' ? 'Skill Assessment' : 'Exam'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: isPassed ? '#10b981' : '#ef4444'
                      }}>
                        {result.percentage}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {result.score}/{result.totalPoints}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: isPassed ? '#dcfce7' : '#fee2e2',
                        color: isPassed ? '#166534' : '#991b1b'
                      }}>
                        {isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      {new Date(result.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      {Math.floor((result.timeSpent || 0) / 60)}m {(result.timeSpent || 0) % 60}s
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(`/learner/results/${result.examId}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} />
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
                              padding: '6px 12px',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RefreshCw size={14} />
                            Re-attempt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb'
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
              <User size={20} style={{ color: '#6b7280' }} />
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{user?.username}</span>
              {user?.batchCode && (
                <span style={{ 
                  padding: '2px 6px', 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  borderRadius: '4px', 
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {user.batchCode}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/learner/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Profile
            </button>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
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
                  onClick={() => setActiveTab(tab.id)}
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
                    fontWeight: '500'
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'practice' && renderPracticeTests()}
        {activeTab === 'skills' && renderSkillAssessment()}
        {activeTab === 'results' && renderResults()}
        {activeTab === 'certificates' && renderCertificates()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 're-attempts' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Re-attempt Exams</h2>
            
            <div style={{ display: 'grid', gap: '16px' }}>
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