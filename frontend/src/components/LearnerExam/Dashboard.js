import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Award, TrendingUp, Play, Eye } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import api from '../../utils/api';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const { data: exams, isLoading, error: examsError } = useQuery('exams', async () => {
    try {
      const response = await api.get('/api/exams');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      return [];
    }
  });

  const { data: results } = useQuery('student-results', async () => {
    try {
      const response = await api.get('/api/results/student');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch results:', error);
      return [];
    }
  });

  const stats = {
    totalExams: exams?.length || 0,
    completedExams: results?.length || 0,
    averageScore: results?.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0,
    pendingExams: (exams?.length || 0) - (results?.length || 0)
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <BookOpen size={32} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Available Exams</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Award size={32} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.completedExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Completed</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <TrendingUp size={32} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.averageScore}%
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Average Score</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Clock size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.pendingExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Pending</p>
          </div>
        </div>

        {/* Recent Results */}
        {results && results.length > 0 && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Recent Results</h2>
              <button 
                onClick={() => navigate('/learner/results')}
                className="btn btn-secondary"
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
                      {result.exam?.title}
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
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Available Exams
          </h2>
          
          {isLoading ? (
            <p>Loading exams...</p>
          ) : examsError ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
              <p>Failed to load exams. Please refresh the page.</p>
            </div>
          ) : exams?.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {exams.map((exam) => {
                const isCompleted = results?.some(r => r.examId === exam.id);
                
                return (
                  <div 
                    key={exam.id} 
                    className="card" 
                    style={{ 
                      margin: 0,
                      border: '1px solid #e5e7eb',
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
                        className="btn btn-secondary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Eye size={16} style={{ marginRight: '8px' }} />
                        View Result
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/learner/exam/${exam.id}`)}
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
    </DashboardLayout>
  );
};

export default StudentDashboard;