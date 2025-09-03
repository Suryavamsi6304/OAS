import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Users, BookOpen, Award, TrendingUp, Eye, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import ProctoringRequests from './ProctoringRequests';
import axios from 'axios';
import toast from 'react-hot-toast';

const MentorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: results, isLoading: resultsLoading } = useQuery('mentor-results', async () => {
    const response = await axios.get('/api/results/all');
    return response.data.data || [];
  });
  
  const { data: proctoringRequests } = useQuery('proctoring-requests', async () => {
    const response = await axios.get('/api/proctoring/mentor-requests');
    return response.data.data || [];
  }, {
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  const { data: exams } = useQuery('mentor-exams', async () => {
    const response = await axios.get('/api/exams');
    return response.data.data || [];
  });

  const handleGradeEssay = async (resultId, questionId, points) => {
    try {
      await axios.put(`/api/results/${resultId}/grade`, {
        questionId,
        points
      });
      toast.success('Essay graded successfully');
      // Refetch results
    } catch (error) {
      toast.error('Failed to grade essay');
    }
  };

  // Filter results that need manual grading
  const needsGrading = results?.filter(result => 
    result.answers?.some(answer => answer.needsReview)
  ) || [];

  const stats = {
    totalStudents: new Set(results?.map(r => r.studentId)).size || 0,
    totalSubmissions: results?.length || 0,
    needsGrading: needsGrading.length,
    averageScore: results?.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0
  };

  return (
    <DashboardLayout title="Mentor Dashboard">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'dashboard' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'dashboard' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'dashboard' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('proctoring')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'proctoring' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'proctoring' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'proctoring' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Shield size={16} style={{ marginRight: '8px' }} />
            Proctoring Requests
            {proctoringRequests?.length > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {proctoringRequests.length}
              </span>
            )}
          </button>
        </div>
        
        {activeTab === 'proctoring' ? (
          <ProctoringRequests />
        ) : (
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Users size={32} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalStudents}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Active Students</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <BookOpen size={32} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalSubmissions}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Total Submissions</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Clock size={32} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.needsGrading}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Needs Grading</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <TrendingUp size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.averageScore}%
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Average Score</p>
          </div>
        </div>

        {/* Submissions Needing Review */}
        {needsGrading.length > 0 && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              Submissions Requiring Manual Grading
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {needsGrading.map((result) => (
                <div 
                  key={result.id}
                  className="card"
                  style={{
                    margin: 0,
                    border: '1px solid #f59e0b',
                    backgroundColor: '#fffbeb'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                        {result.student?.name}
                      </h3>
                      <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>
                        {result.exam?.title}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        Submitted: {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                        Pending
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {result.answers?.filter(a => a.needsReview).length} questions to review
                      </div>
                    </div>
                  </div>

                  {/* Questions needing review */}
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      Questions for Review:
                    </h4>
                    
                    {result.answers?.filter(a => a.needsReview).map((answer, index) => {
                      const question = result.exam?.questions?.find(q => q._id === answer.questionId);
                      
                      return (
                        <div 
                          key={answer.questionId}
                          style={{
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ marginBottom: '12px' }}>
                            <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                              Question: {question?.question}
                            </h5>
                            <p style={{ 
                              fontSize: '14px', 
                              color: '#6b7280',
                              margin: '0 0 8px 0'
                            }}>
                              Type: {question?.type} | Max Points: {question?.points}
                            </p>
                          </div>
                          
                          <div style={{ 
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            marginBottom: '12px'
                          }}>
                            <p style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                              Student Answer:
                            </p>
                            <p style={{ 
                              fontSize: '14px', 
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: question?.type === 'coding' ? 'monospace' : 'inherit'
                            }}>
                              {answer.answer}
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>
                              Award Points:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={question?.points}
                              defaultValue={answer.points || 0}
                              style={{
                                width: '80px',
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px'
                              }}
                              onChange={(e) => {
                                // Store the value for later submission
                                answer.newPoints = parseInt(e.target.value);
                              }}
                            />
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>
                              / {question?.points}
                            </span>
                            <button
                              onClick={() => handleGradeEssay(result.id, answer.questionId, answer.newPoints || 0)}
                              className="btn btn-primary"
                              style={{ fontSize: '12px', padding: '4px 12px' }}
                            >
                              Grade
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Submissions */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            All Student Submissions
          </h2>
          
          {resultsLoading ? (
            <p>Loading submissions...</p>
          ) : results?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Exam</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Score</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Grade</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const getGradeLetter = (percentage) => {
                      if (percentage >= 90) return 'A+';
                      if (percentage >= 80) return 'A';
                      if (percentage >= 70) return 'B';
                      if (percentage >= 60) return 'C';
                      return 'F';
                    };

                    const getGradeColor = (percentage) => {
                      if (percentage >= 70) return '#10b981';
                      if (percentage >= 50) return '#f59e0b';
                      return '#ef4444';
                    };

                    return (
                      <tr key={result.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px' }}>{result.student?.name}</td>
                        <td style={{ padding: '12px' }}>{result.exam?.title}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            color: getGradeColor(result.percentage),
                            fontWeight: '600'
                          }}>
                            {result.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            color: getGradeColor(result.percentage),
                            fontWeight: '600'
                          }}>
                            {getGradeLetter(result.percentage)}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>
                          {new Date(result.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {result.answers?.some(a => a.needsReview) ? (
                              <Clock size={16} style={{ color: '#f59e0b', marginRight: '4px' }} />
                            ) : (
                              <CheckCircle size={16} style={{ color: '#10b981', marginRight: '4px' }} />
                            )}
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              color: result.answers?.some(a => a.needsReview) ? '#f59e0b' : '#10b981'
                            }}>
                              {result.answers?.some(a => a.needsReview) ? 'Needs Review' : 'Completed'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            <Eye size={14} style={{ marginRight: '4px' }} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No submissions yet.</p>
            </div>
          )}
        </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorDashboard;