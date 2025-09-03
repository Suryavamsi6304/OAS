import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProctoringRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    // Poll for new requests every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/proctoring/mentor-requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch proctoring requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sessionId) => {
    try {
      await axios.post(`/api/proctoring/mentor-response/${sessionId}`, {
        approved: true,
        comment: 'Approved by mentor'
      });
      toast.success('Student approved to continue exam');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (sessionId) => {
    try {
      await axios.post(`/api/proctoring/mentor-response/${sessionId}`, {
        approved: false,
        rejected: true,
        comment: 'Rejected due to multiple violations'
      });
      toast.success('Student exam terminated');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getSeverityColor = (riskScore) => {
    if (riskScore >= 80) return '#dc2626';
    if (riskScore >= 60) return '#ea580c';
    if (riskScore >= 40) return '#d97706';
    return '#ca8a04';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading proctoring requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Shield size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          Proctoring Requests
        </h1>
        {requests.length > 0 && (
          <span style={{
            marginLeft: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '12px',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {requests.length}
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Shield size={48} style={{ color: '#10b981', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Pending Requests
          </h3>
          <p style={{ color: '#6b7280' }}>
            All students are currently following proctoring guidelines.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((request) => (
            <div 
              key={request.sessionId}
              className="card"
              style={{
                border: '2px solid #fbbf24',
                backgroundColor: '#fffbeb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={20} style={{ color: '#374151', marginRight: '8px' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                      {request.studentName}
                    </h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                      Exam: {request.examTitle}
                    </p>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: getSeverityColor(request.riskScore),
                    marginBottom: '4px'
                  }}>
                    Risk Score: {request.riskScore}/100
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {request.violations} violations
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <AlertTriangle size={16} style={{ color: '#dc2626', marginRight: '8px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                    Last Violation
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                  {request.reason}
                </p>
              </div>

              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Clock size={16} style={{ color: '#0369a1', marginRight: '8px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                    Request Details
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#374151' }}>
                  <p style={{ margin: '0 0 4px 0' }}>
                    Session ID: {request.sessionId}
                  </p>
                  <p style={{ margin: '0 0 4px 0' }}>
                    Time: {new Date(request.timestamp).toLocaleString()}
                  </p>
                  <p style={{ margin: 0 }}>
                    Status: Student is blocked and waiting for approval
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleReject(request.sessionId)}
                  className="btn"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px'
                  }}
                >
                  <XCircle size={16} style={{ marginRight: '8px' }} />
                  Terminate Exam
                </button>
                
                <button
                  onClick={() => handleApprove(request.sessionId)}
                  className="btn"
                  style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px'
                  }}
                >
                  <CheckCircle size={16} style={{ marginRight: '8px' }} />
                  Allow Continue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProctoringRequests;