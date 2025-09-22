import React from 'react';
import { useQuery } from 'react-query';
import { Award, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';

const Results = () => {
  const { data: results, isLoading } = useQuery('student-results', async () => {
    const response = await axios.get('/api/results/student');
    return response.data.data || [];
  });

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#f59e0b';
    if (percentage >= 60) return '#ef4444';
    return '#6b7280';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'F';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 70) return <CheckCircle size={20} style={{ color: '#10b981' }} />;
    if (percentage >= 50) return <AlertCircle size={20} style={{ color: '#f59e0b' }} />;
    return <XCircle size={20} style={{ color: '#ef4444' }} />;
  };

  const stats = results?.length > 0 ? {
    totalExams: results.length,
    averageScore: Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length),
    passed: results.filter(r => r.percentage >= 70).length,
    totalPoints: results.reduce((sum, r) => sum + r.score, 0)
  } : { totalExams: 0, averageScore: 0, passed: 0, totalPoints: 0 };

  return (
    <DashboardLayout title="Exam Results">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Stats Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Award size={32} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Exams Taken</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <TrendingUp size={32} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.averageScore}%
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Average Score</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <CheckCircle size={32} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.passed}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Passed (≥70%)</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Award size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalPoints}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Total Points</p>
          </div>
        </div>

        {/* Results List */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Detailed Results
          </h2>
          
          {isLoading ? (
            <p>Loading results...</p>
          ) : results?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.map((result) => (
                <div 
                  key={result.id}
                  className="card"
                  style={{
                    margin: 0,
                    border: '1px solid #e5e7eb',
                    padding: '24px'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        {getStatusIcon(result.percentage)}
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          margin: '0 0 0 8px' 
                        }}>
                          {result.exam?.title}
                        </h3>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Clock size={16} style={{ marginRight: '4px' }} />
                          {new Date(result.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          Time: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                        </div>
                        <div>
                          Status: {result.status}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: 'bold',
                        color: getGradeColor(result.percentage),
                        lineHeight: 1
                      }}>
                        {result.percentage}%
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: getGradeColor(result.percentage)
                      }}>
                        {getGradeLetter(result.percentage)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {result.score}/{result.totalPoints} points
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${result.percentage}%`,
                        height: '100%',
                        backgroundColor: getGradeColor(result.percentage),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                  {/* Answer Breakdown */}
                  {result.answers && (
                    <div>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        marginBottom: '12px',
                        color: '#374151'
                      }}>
                        Answer Breakdown
                      </h4>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '12px' 
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#f0fdf4',
                          borderRadius: '6px',
                          border: '1px solid #bbf7d0'
                        }}>
                          <CheckCircle size={16} style={{ color: '#10b981', marginRight: '8px' }} />
                          <span style={{ fontSize: '14px' }}>
                            Correct: {result.answers.filter(a => a.isCorrect).length}
                          </span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '6px',
                          border: '1px solid #fecaca'
                        }}>
                          <XCircle size={16} style={{ color: '#ef4444', marginRight: '8px' }} />
                          <span style={{ fontSize: '14px' }}>
                            Incorrect: {result.answers.filter(a => !a.isCorrect && !a.needsReview).length}
                          </span>
                        </div>
                        
                        {result.answers.some(a => a.needsReview) && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#fefce8',
                            borderRadius: '6px',
                            border: '1px solid #fde047'
                          }}>
                            <AlertCircle size={16} style={{ color: '#f59e0b', marginRight: '8px' }} />
                            <span style={{ fontSize: '14px' }}>
                              Under Review: {result.answers.filter(a => a.needsReview).length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <Award size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No exam results yet. Take an exam to see your results here.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Results;