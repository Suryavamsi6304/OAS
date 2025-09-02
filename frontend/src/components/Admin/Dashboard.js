import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Award, TrendingUp, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: analytics, isLoading: analyticsLoading } = useQuery('analytics', async () => {
    const response = await axios.get('/api/analytics');
    return response.data.data || {};
  });

  const { data: exams, isLoading: examsLoading, refetch: refetchExams } = useQuery('admin-exams', async () => {
    const response = await axios.get('/api/exams');
    return response.data.data || [];
  });

  const { data: results } = useQuery('all-results', async () => {
    const response = await axios.get('/api/results/all');
    return response.data.data || [];
  });

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      await axios.delete(`/api/exams/${examId}`);
      toast.success('Exam deleted successfully');
      refetchExams();
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const stats = {
    totalStudents: analytics?.totalStudents || 0,
    totalExams: exams?.length || 0,
    totalSubmissions: results?.length || 0,
    averageScore: results?.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
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
            <p style={{ color: '#6b7280', margin: 0 }}>Total Students</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <BookOpen size={32} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalExams}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Active Exams</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Award size={32} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.totalSubmissions}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Submissions</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <TrendingUp size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {stats.averageScore}%
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Avg Score</p>
          </div>
        </div>

        {/* Recent Submissions */}
        {results && results.length > 0 && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              Recent Submissions
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Exam</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Score</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 5).map((result) => (
                    <tr key={result.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>{result.student?.name}</td>
                      <td style={{ padding: '12px' }}>{result.exam?.title}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          color: result.percentage >= 70 ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        {new Date(result.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: result.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: result.status === 'completed' ? '#166534' : '#92400e'
                        }}>
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Exam Management */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              Exam Management
            </h2>
            <button 
              onClick={() => navigate('/admin/exams')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Plus size={16} style={{ marginRight: '8px' }} />
              Create Exam
            </button>
          </div>
          
          {examsLoading ? (
            <p>Loading exams...</p>
          ) : exams?.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {exams.map((exam) => (
                <div 
                  key={exam.id} 
                  className="card" 
                  style={{ 
                    margin: 0,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                        {exam.title}
                      </h3>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: exam.isActive ? '#dcfce7' : '#fef2f2',
                        color: exam.isActive ? '#166534' : '#dc2626'
                      }}>
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p style={{ color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                      {exam.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Duration:</span>
                      <span>{exam.duration} minutes</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Questions:</span>
                      <span>{exam.questions?.length || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Total Points:</span>
                      <span>{exam.totalPoints || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>Submissions:</span>
                      <span>{results?.filter(r => r.examId === exam.id).length || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate(`/admin/exam/${exam.id}/results`)}
                      className="btn btn-secondary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Eye size={16} style={{ marginRight: '8px' }} />
                      Results
                    </button>
                    <button
                      onClick={() => navigate(`/admin/exams?edit=${exam.id}`)}
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Edit size={16} style={{ marginRight: '8px' }} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="btn btn-danger"
                      style={{ padding: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No exams created yet.</p>
              <button 
                onClick={() => navigate('/admin/exams')}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                Create Your First Exam
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;