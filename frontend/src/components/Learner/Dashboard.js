import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, DollarSign, Building, Eye } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';

/**
 * Employee Dashboard Component
 */
const EmployeeDashboard = () => {
  const navigate = useNavigate();

  // Fetch available jobs
  const { data: jobs, isLoading } = useQuery('jobs', async () => {
    const response = await axios.get('/api/jobs');
    return response.data.data;
  });

  // Fetch user applications
  const { data: applications } = useQuery('my-applications', async () => {
    const response = await axios.get('/api/applications');
    return response.data.data;
  });

  const getStatusColor = (status) => {
    const colors = {
      applied: '#3b82f6',
      under_review: '#f59e0b',
      interview_scheduled: '#8b5cf6',
      selected: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      applied: 'Applied',
      under_review: 'Under Review',
      interview_scheduled: 'Interview Scheduled',
      selected: 'Selected',
      rejected: 'Rejected'
    };
    return texts[status] || status;
  };

  return (
    <DashboardLayout title="Find Your Dream Job">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Briefcase size={32} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {jobs?.length || 0}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Available Jobs</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Clock size={32} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {applications?.length || 0}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Applications Sent</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <Building size={32} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
              {applications?.filter(app => app.status === 'interview_scheduled').length || 0}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Interviews</p>
          </div>
        </div>

        {/* Recent Applications */}
        {applications && applications.length > 0 && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Recent Applications</h2>
              <button 
                onClick={() => navigate('/learner/applications')}
                className="btn btn-secondary"
              >
                View All
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {applications.slice(0, 3).map((app) => (
                <div 
                  key={app.id}
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
                      {app.job?.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span 
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(app.status) + '20',
                      color: getStatusColor(app.status)
                    }}
                  >
                    {getStatusText(app.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Jobs */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Available Positions
          </h2>
          
          {isLoading ? (
            <p>Loading jobs...</p>
          ) : jobs?.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="card" 
                  style={{ 
                    margin: 0,
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {job.title}
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                      {job.description.substring(0, 120)}...
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {job.department && (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <Building size={16} style={{ marginRight: '8px' }} />
                        {job.department}
                      </div>
                    )}
                    {job.location && (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <MapPin size={16} style={{ marginRight: '8px' }} />
                        {job.location}
                      </div>
                    )}
                    {job.salary && (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <DollarSign size={16} style={{ marginRight: '8px' }} />
                        {job.salary}
                      </div>
                    )}
                    {job.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <Clock size={16} style={{ marginRight: '8px' }} />
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/learner/job/${job.id}`)}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Eye size={16} style={{ marginRight: '8px' }} />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <Briefcase size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No job openings available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;