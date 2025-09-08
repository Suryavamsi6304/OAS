import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, BookOpen, Award, TrendingUp, Plus, Eye, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[2] || 'dashboard';

  const { data: analytics } = useQuery('analytics', async () => {
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

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery('admin-users', async () => {
    const response = await axios.get('/api/admin/users');
    return response.data.data || [];
  }, {
    enabled: currentView === 'users'
  });

  const { data: pendingApprovals, isLoading: approvalsLoading, refetch: refetchApprovals } = useQuery('pending-approvals', async () => {
    console.log('Fetching pending approvals...');
    const response = await axios.get('/api/admin/pending-approvals');
    console.log('Pending approvals response:', response.data);
    return response.data.data || [];
  }, {
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  const { data: batches } = useQuery('batches', async () => {
    const response = await axios.get('/api/batches');
    return response.data.data || [];
  });

  const handleApproveUser = async (userId, approved) => {
    try {
      await axios.put(`/api/admin/approve-user/${userId}`, { approved });
      toast.success(approved ? 'User approved successfully' : 'User rejected successfully');
      refetchApprovals();
      refetchUsers();
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

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

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'learner',
    batchCode: ''
  });

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      toast.success('User status updated successfully');
      refetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', userForm);
      toast.success('User created successfully');
      setShowUserForm(false);
      setUserForm({ username: '', email: '', password: '', name: '', role: 'learner', batchCode: '' });
      refetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/users/${editingUser.id}`, userForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      setShowUserForm(false);
      setUserForm({ username: '', email: '', password: '', name: '', role: 'learner', batchCode: '' });
      refetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted successfully');
      refetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      batchCode: user.batchCode || ''
    });
    setShowUserForm(true);
  };

  const stats = {
    totalStudents: analytics?.totalStudents || 0,
    totalExams: exams?.length || 0,
    totalSubmissions: results?.length || 0,
    averageScore: results?.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0
  };

  const renderUsersView = () => (
    <>
      {/* Pending Approvals */}
      {console.log('Pending approvals in render:', pendingApprovals)}
      {pendingApprovals?.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', border: '2px solid #f59e0b' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#f59e0b' }}>
            Pending Approvals ({pendingApprovals.length})
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Batch</th>
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
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveUser(user.id, true)}
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <UserCheck size={14} style={{ marginRight: '4px' }} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveUser(user.id, false)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <UserX size={14} style={{ marginRight: '4px' }} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            User Management
          </h2>
          <button 
            onClick={() => setShowUserForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Plus size={16} style={{ marginRight: '8px' }} />
            Add User
          </button>
        </div>
      
      {usersLoading ? (
        <p>Loading users...</p>
      ) : users?.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Batch</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>{user.name}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: user.role === 'admin' ? '#fef3c7' : user.role === 'mentor' ? '#dbeafe' : '#dcfce7',
                      color: user.role === 'admin' ? '#92400e' : user.role === 'mentor' ? '#1e40af' : '#166534'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    {user.batchCode || 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: user.isActive ? '#dcfce7' : '#fef2f2',
                      color: user.isActive ? '#166534' : '#dc2626'
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      >
                        <Trash2 size={14} />
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
          <p>No users found.</p>
        </div>
      )}
      </div>
      
      {/* User Form Modal */}
      {showUserForm && (
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
          <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              {!editingUser && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="learner">Learner</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {userForm.role === 'learner' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Batch</label>
                  <select
                    value={userForm.batchCode}
                    onChange={(e) => setUserForm({...userForm, batchCode: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Select a batch</option>
                    {batches?.map((batch) => (
                      <option key={batch.id} value={batch.code}>
                        {batch.name} ({batch.code})
                      </option>
                    ))}
                  </select>
                  {(!batches || batches.length === 0) && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      No batches available. Please create a batch first.
                    </p>
                  )}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                    setUserForm({ username: '', email: '', password: '', name: '', role: 'learner', batchCode: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout title={currentView === 'users' ? 'User Management' : 'Admin Dashboard'}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {currentView === 'users' ? renderUsersView() : (
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
        </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;