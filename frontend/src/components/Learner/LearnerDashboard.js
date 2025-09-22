import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Clock, Award, Play, Eye, User, LogOut, Code, Target, TrendingUp, Calendar, Download, Star } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const LearnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, resultsRes, practiceRes, skillsRes] = await Promise.all([
        api.get('/api/exams'),
        api.get('/api/results/student'),
        api.get('/api/practice-tests').catch(() => ({ data: { data: [] } })),
        api.get('/api/skills/assessment').catch(() => ({ data: { data: [] } }))
      ]);
      
      setExams(examsRes.data.data || []);
      setResults(resultsRes.data.data || []);
      setPracticeTests(practiceRes.data.data || []);
      setSkills(skillsRes.data.data || []);
      
      // Mock certificates for completed exams
      const mockCertificates = results.filter(r => r.percentage >= 70).map(r => ({
        id: r.id,
        examTitle: r.exam?.title,
        score: r.percentage,
        date: r.createdAt,
        certificateId: `CERT-${r.id}-${Date.now()}`
      }));
      setCertificates(mockCertificates);
      
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
    practiceCompleted: practiceTests.filter(p => p.completed).length,
    skillsAssessed: skills.length,
    certificatesEarned: certificates.length,
    totalTimeSpent: results.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
  };
  
  const getSkillLevel = (score) => {
    if (score >= 90) return { level: 'Expert', color: '#10b981' };
    if (score >= 70) return { level: 'Advanced', color: '#3b82f6' };
    if (score >= 50) return { level: 'Intermediate', color: '#f59e0b' };
    return { level: 'Beginner', color: '#ef4444' };
  };
  
  const downloadCertificate = (cert) => {
    toast.success(`Certificate for ${cert.examTitle} downloaded!`);
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
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              Student Dashboard
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Welcome back, {user?.name}!</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} style={{ color: '#6b7280' }} />
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{user?.username}</span>
            </div>
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

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <BookOpen size={32} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              {stats.totalExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Available Exams</p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Award size={32} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              {stats.completedExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Completed</p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Clock size={32} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              {stats.averageScore}%
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Average Score</p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Clock size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              {stats.pendingExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Pending</p>
          </div>
        </div>

        {/* Recent Results */}
        {results.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '32px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Recent Results</h2>
              <button 
                onClick={() => navigate('/learner/results')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                View All
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.slice(0, 3).map((result) => (
                <div 
                  key={result.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {result.exam?.title || 'Exam'}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      Completed {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      color: result.percentage >= 70 ? '#10b981' : result.percentage >= 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {result.percentage}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {result.score}/{result.totalPoints} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Exams */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Available Exams
          </h2>
          
          {exams.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {exams.map((exam) => {
                const isCompleted = results.some(r => r.examId === exam.id);
                
                return (
                  <div 
                    key={exam.id} 
                    style={{ 
                      padding: '24px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      opacity: isCompleted ? 0.7 : 1
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {exam.title}
                      </h3>
                      <p style={{ color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                        {exam.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <Clock size={16} style={{ marginRight: '8px' }} />
                        Duration: {exam.duration} minutes
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <BookOpen size={16} style={{ marginRight: '8px' }} />
                        Questions: {exam.questions?.length || 0}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <Award size={16} style={{ marginRight: '8px' }} />
                        Total Points: {exam.totalPoints || 0}
                      </div>
                    </div>

                    {isCompleted ? (
                      <button
                        onClick={() => navigate('/learner/results')}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <Eye size={16} style={{ marginRight: '8px' }} />
                        View Result
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/learner/exam/${exam.id}`)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <Play size={16} style={{ marginRight: '8px' }} />
                        Start Exam
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No exams available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;