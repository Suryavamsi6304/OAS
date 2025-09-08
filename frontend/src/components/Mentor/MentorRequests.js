import React, { useState, useEffect } from 'react';
import { Clock, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MentorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/proctoring/mentor-requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch mentor requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (sessionId, action, comments = '') => {
    try {
      await axios.post(`/api/proctoring/mentor-request/${sessionId}`, {
        action,
        comments
      });
      
      toast.success(`Request ${action}d successfully`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading mentor requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <AlertTriangle size={24} style={{ color: '#f59e0b', marginRight: '12px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          Student Unblock Requests
        </h1>
        <div style={{
          marginLeft: '16px',
          padding: '4px 8px',
          backgroundColor: requests.length > 0 ? '#f59e0b' : '#10b981',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {requests.length} Pending
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            No Pending Requests
          </h3>
          <p style={{ color: '#6b7280' }}>
            All students are currently following exam protocols.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {requests.map((request) => (
            <div key={request.sessionId} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={20} style={{ color: '#374151', marginRight: '12px' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                      {request.studentName}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      Session: {request.sessionId}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '8px', 
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                    Violation Details
                  </span>
                  <span style={{ fontSize: '14px', color: '#dc2626' }}>
                    {request.violations} violations • Risk: {request.riskScore}%
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
                  {request.reason}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleRequest(request.sessionId, 'reject')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <XCircle size={16} />
                  Reject & Terminate
                </button>
                
                <button
                  onClick={() => handleRequest(request.sessionId, 'approve')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <CheckCircle size={16} />
                  Approve & Continue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorRequests;