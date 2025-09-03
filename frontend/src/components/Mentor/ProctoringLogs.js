import React, { useState, useEffect } from 'react';
import { Shield, Eye, AlertTriangle, Clock, User, Filter } from 'lucide-react';
import axios from 'axios';

const ProctoringLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`/api/proctoring/logs?filter=${filter}`);
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch proctoring logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#ca8a04';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'flagged': return '#ef4444';
      case 'terminated': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading proctoring logs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Shield size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Proctoring Logs
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={16} style={{ color: '#6b7280' }} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="flagged">Flagged</option>
            <option value="violations">With Violations</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Shield size={48} style={{ color: '#6b7280', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Proctoring Logs
          </h3>
          <p style={{ color: '#6b7280' }}>
            No proctoring sessions found for the selected filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {logs.map((log) => (
            <div key={log.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={20} style={{ color: '#374151', marginRight: '12px' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                      {log.studentName}
                    </h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                      {log.examTitle} • Session: {log.sessionId}
                    </p>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getStatusColor(log.status) + '20',
                    color: getStatusColor(log.status)
                  }}>
                    {log.status.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Risk: {log.riskScore}/100
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Duration</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {Math.floor(log.duration / 60)}m {log.duration % 60}s
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Violations</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: log.violations > 0 ? '#ef4444' : '#10b981' }}>
                    {log.violations}
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Started</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {new Date(log.startTime).toLocaleString()}
                  </div>
                </div>
              </div>

              {log.recentViolations && log.recentViolations.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Recent Violations
                  </h4>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {log.recentViolations.map((violation, index) => (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          marginBottom: '4px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <AlertTriangle size={14} style={{ 
                          color: getSeverityColor(violation.severity), 
                          marginRight: '8px' 
                        }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: '500' }}>{violation.type}:</span> {violation.details}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProctoringLogs;