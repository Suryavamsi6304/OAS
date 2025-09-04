import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Users, BookOpen, Award, TrendingUp, Eye, CheckCircle, XCircle, Clock, Shield, FileText, Video } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import CommNav from '../Communication/CommNav';
import ProctoringRequests from './ProctoringRequests';
import ViolationRequests from './ViolationRequests';
import ProctoringLogs from './ProctoringLogs';
import LiveProctoring from './LiveProctoring';
import BatchPerformance from './BatchPerformance';
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
    refetchInterval: 10000
  });

  const { data: pendingApprovals, refetch: refetchApprovals } = useQuery('mentor-pending-approvals', async () => {
    console.log('Mentor fetching pending approvals...');
    const response = await axios.get('/api/admin/pending-approvals');
    console.log('Mentor pending approvals response:', response.data);
    return response.data.data || [];
  }, {
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  const handleApproveUser = async (userId, approved) => {
    try {
      await axios.put(`/api/admin/approve-user/${userId}`, { approved });
      toast.success(approved ? 'User approved successfully' : 'User rejected successfully');
      refetchApprovals();
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

  const handleGradeEssay = async (resultId, questionId, points) => {
    try {
      await axios.put(`/api/results/${resultId}/grade`, {
        questionId,
        points
      });
      toast.success('Essay graded successfully');
    } catch (error) {
      toast.error('Failed to grade essay');
    }
  };

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
      <CommNav userRole="mentor" />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '24px',
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0',
          padding: '0 16px'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'dashboard' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'dashboard' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'dashboard' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📊 Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('approvals')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'approvals' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'approvals' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'approvals' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            👥 Approvals
            {pendingApprovals?.length > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#f59e0b',
                color: 'white',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pendingApprovals.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'requests' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'requests' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'requests' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            🛡️ Violation Requests
            {proctoringRequests?.length > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {proctoringRequests.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'logs' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'logs' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'logs' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📋 Proctoring Logs
          </button>
          
          <button
            onClick={() => setActiveTab('live')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'live' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'live' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'live' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📹 Live Monitor
          </button>
          
          <button
            onClick={() => setActiveTab('performance')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'performance' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'performance' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'performance' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🏆 Batch Performance
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'approvals' && (
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              User Registration Approvals
            </h2>
            {pendingApprovals?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Batch</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px' }}>{user.name}</td>
                        <td style={{ padding: '12px' }}>{user.email}</td>
                        <td style={{ padding: '12px' }}>{user.role}</td>
                        <td style={{ padding: '12px' }}>{user.batchCode || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveUser(user.id, true)}
                              className="btn btn-success"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <CheckCircle size={14} style={{ marginRight: '4px' }} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveUser(user.id, false)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <XCircle size={14} style={{ marginRight: '4px' }} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No pending approvals.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'requests' && <ViolationRequests />}
        {activeTab === 'logs' && <ProctoringLogs />}
        {activeTab === 'live' && <LiveProctoring />}
        {activeTab === 'performance' && <BatchPerformance />}
        
        {activeTab === 'dashboard' && (
          <>
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
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
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
                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                              <Eye size={14} style={{ marginRight: '4px' }} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorDashboard;