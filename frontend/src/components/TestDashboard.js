import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '20px'
        }}>
          <h1 style={{ margin: 0, color: '#1f2937' }}>
            Welcome to OAS Dashboard
          </h1>
          <button 
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#374151', marginBottom: '15px' }}>User Information</h2>
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '20px', 
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> <span style={{ 
              textTransform: 'capitalize',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>{user?.role}</span></p>
          </div>
        </div>

        <div>
          <h2 style={{ color: '#374151', marginBottom: '15px' }}>Available Features</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            {user?.role === 'learner' && (
              <>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Job Search</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    Browse and apply for available positions
                  </p>
                </div>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#15803d' }}>Applications</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    Track your job applications
                  </p>
                </div>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fefce8', 
                  borderRadius: '6px',
                  border: '1px solid #fde047'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#a16207' }}>Assessments</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    Take online assessments
                  </p>
                </div>
              </>
            )}
            
            {user?.role === 'admin' && (
              <>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fef2f2', 
                  borderRadius: '6px',
                  border: '1px solid #fecaca'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>User Management</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    Manage system users
                  </p>
                </div>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f3e8ff', 
                  borderRadius: '6px',
                  border: '1px solid #d8b4fe'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#7c3aed' }}>Job Postings</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    Create and manage job postings
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            🎉 Login successful! The dashboard is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;