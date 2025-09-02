import React from 'react';
import { useQuery } from 'react-query';
import { ArrowLeft, Clock, CheckCircle, XCircle, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';

/**
 * Application Tracker Component
 */
const ApplicationTracker = () => {
  const navigate = useNavigate();

  // Fetch user applications
  const { data: applications, isLoading } = useQuery('my-applications', async () => {
    const response = await axios.get('/api/applications');
    return response.data.data;
  });

  const getStatusIcon = (status) => {
    const icons = {
      applied: Clock,
      under_review: Clock,
      interview_scheduled: Calendar,
      selected: CheckCircle,
      rejected: XCircle
    };
    return icons[status] || Clock;
  };

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

  const getProgressPercentage = (status) => {
    const progress = {
      applied: 25,
      under_review: 50,
      interview_scheduled: 75,
      selected: 100,
      rejected: 0
    };
    return progress[status] || 0;
  };

  return (
    <DashboardLayout title="My Applications">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/employee')}
          className="btn btn-secondary"
          style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Dashboard
        </button>

        {/* Applications List */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Application Status Tracker
          </h2>

          {isLoading ? (
            <p>Loading applications...</p>
          ) : applications?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {applications.map((app) => {
                const StatusIcon = getStatusIcon(app.status);
                const statusColor = getStatusColor(app.status);
                const progress = getProgressPercentage(app.status);

                return (
                  <div 
                    key={app.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px',
                      backgroundColor: 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Application Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          marginBottom: '4px',
                          margin: 0
                        }}>
                          {app.job?.title}
                        </h3>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#6b7280',
                          margin: '4px 0 0 0'
                        }}>
                          {app.job?.department} • Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: statusColor + '20',
                        color: statusColor
                      }}>
                        <StatusIcon size={16} style={{ marginRight: '6px' }} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          {getStatusText(app.status)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <span>Applied</span>
                        <span>Under Review</span>
                        <span>Interview</span>
                        <span>Decision</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: app.status === 'rejected' ? '#ef4444' : '#10b981',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Application Details */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                          Application ID
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                          #{app.id.substring(0, 8)}
                        </p>
                      </div>
                      
                      {app.mentor && (
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                            Assigned Mentor
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                            {app.mentor.name}
                          </p>
                        </div>
                      )}
                      
                      {app.score && (
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                            Assessment Score
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                            {app.score}/100
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    {app.feedback && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <FileText size={16} style={{ color: '#3b82f6', marginRight: '6px' }} />
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                            Feedback from Mentor
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>
                          {app.feedback}
                        </p>
                      </div>
                    )}

                    {/* Documents */}
                    {app.documents && app.documents.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Submitted Documents:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {app.documents.map((doc, index) => (
                            <span 
                              key={index}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#374151'
                              }}
                            >
                              {doc.name || `Document ${index + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                No Applications Yet
              </h3>
              <p style={{ marginBottom: '24px' }}>
                Start applying for jobs to track your application status here.
              </p>
              <button 
                onClick={() => navigate('/employee')}
                className="btn btn-primary"
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationTracker;