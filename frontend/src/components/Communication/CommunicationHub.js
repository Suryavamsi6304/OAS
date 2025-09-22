import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Video, MessageSquare, Users, Calendar, Phone, Settings, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import io from 'socket.io-client';

const CommunicationHub = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [loading, isAuthenticated, navigate]);
  const [activeTab, setActiveTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const socketRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    
    checkMeetingInvites();
    setupRealTimeUpdates();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loading, user, isAuthenticated]);

  const setupRealTimeUpdates = () => {
    // Socket.IO for real-time notifications
    const { getSocketUrl } = require('../../utils/networkConfig');
    socketRef.current = io(getSocketUrl());
    
    socketRef.current.on('meeting-started', (data) => {
      if (user?.role === 'learner' && data.batch === user?.batchCode) {
        checkMeetingInvites(); // Refresh meeting invites
      }
    });
    
    socketRef.current.on('meeting-ended', (data) => {
      if (user?.role === 'learner' && data.batch === user?.batchCode) {
        setMeetings([]); // Clear meetings immediately
      }
    });
    
    // Polling as backup (every 10 seconds)
    if (user?.role === 'learner') {
      pollingRef.current = setInterval(() => {
        checkMeetingInvites();
      }, 10000);
    }
  };



  const checkMeetingInvites = async () => {
    if (user?.role === 'learner' && user?.batchCode) {
      try {
        const response = await api.get(`/api/meetings/invites/${user.batchCode}`);
        if (response.data.data) {
          setMeetings([response.data.data]);
        } else {
          setMeetings([]);
        }
      } catch (error) {
        console.error('Failed to check meeting invites');
        setMeetings([]);
      }
    }
  };

  const startMeeting = async (meetingData) => {
    try {
      const response = await api.post('/api/meetings/invite', meetingData);
      if (response.data.success) {
        // Navigate to meeting immediately
        navigate(`/meeting/${meetingData.meetingId}`);
      }
    } catch (error) {
      console.error('Failed to start meeting');
    }
  };

  const CreateMeetingForm = () => {
    const [title, setTitle] = useState('');
    const [batchInput, setBatchInput] = useState('');
    const [selectedBatches, setSelectedBatches] = useState([]);

    const addBatch = () => {
      if (batchInput.trim() && !selectedBatches.includes(batchInput.trim())) {
        setSelectedBatches(prev => [...prev, batchInput.trim()]);
        setBatchInput('');
      }
    };

    const removeBatch = (batch) => {
      setSelectedBatches(prev => prev.filter(b => b !== batch));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (title && selectedBatches.length > 0) {
        startMeeting({
          title,
          batches: selectedBatches,
          meetingId: `MEET-${Date.now()}`
        });
      }
    };

    return (
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Create New Meeting</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Add Batch Codes
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="Enter batch code (e.g., BATCH001)"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBatch())}
              />
              <button
                type="button"
                onClick={addBatch}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add
              </button>
            </div>
            
            {selectedBatches.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedBatches.map(batch => (
                  <div
                    key={batch}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #3b82f6',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#3b82f6'
                    }}
                  >
                    {batch}
                    <button
                      type="button"
                      onClick={() => removeBatch(batch)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0',
                        marginLeft: '4px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowCreateMeeting(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Video size={16} />
              Start Meeting
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Communication Hub</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Manage meetings and communications</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {[
            { id: 'meetings', label: 'Meetings', icon: Video },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'meetings' && (
          <div>
            {user?.role === 'mentor' && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setShowCreateMeeting(true)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  <Video size={18} />
                  Start New Meeting
                </button>
              </div>
            )}

            {showCreateMeeting ? (
              <CreateMeetingForm />
            ) : (
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {user?.role === 'mentor' ? 'Active Meetings' : 'Meeting Invitations'}
                </h3>
                
                {meetings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>{user?.role === 'mentor' ? 'No active meetings' : 'No meeting invitations'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {meetings.map((meeting, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        border: '2px solid #10b981',
                        borderRadius: '12px',
                        backgroundColor: '#f0fdf4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                            {meeting.title}
                          </h4>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                            Batches: {meeting.batches?.join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Phone size={16} />
                          Join Meeting
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Messages</h3>
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Messaging feature coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Participants</h3>
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Participant management coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Communication Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Audio Settings</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ fontSize: '14px' }}>Auto-mute when joining meetings</span>
                </label>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Video Settings</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ fontSize: '14px' }}>Auto-disable video when joining meetings</span>
                </label>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Notifications</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ fontSize: '14px' }}>Show meeting notifications</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;