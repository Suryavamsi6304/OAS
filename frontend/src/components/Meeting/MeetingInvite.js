import React, { useState, useEffect } from 'react';
import { Users, Send, X, Plus } from 'lucide-react';
import axios from 'axios';

const MeetingInvite = ({ onStartMeeting, onClose }) => {
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [customBatch, setCustomBatch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    // Fetch actual batches from the system
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await axios.get('/api/batches');
      setAvailableBatches(response.data.data || []);
    } catch (error) {
      // Fallback to common batch codes if API fails
      setAvailableBatches(['BATCH001', 'BATCH002', 'BATCH003']);
    }
  };

  const addCustomBatch = () => {
    if (customBatch.trim() && !availableBatches.includes(customBatch.trim())) {
      setAvailableBatches([...availableBatches, customBatch.trim()]);
      setSelectedBatches([...selectedBatches, customBatch.trim()]);
      setCustomBatch('');
      setShowCustomInput(false);
    }
  };

  const handleBatchToggle = (batch) => {
    setSelectedBatches(prev => 
      prev.includes(batch) 
        ? prev.filter(b => b !== batch)
        : [...prev, batch]
    );
  };

  const startMeeting = () => {
    if (!meetingTitle.trim() || selectedBatches.length === 0) return;
    
    const meetingData = {
      title: meetingTitle,
      batches: selectedBatches,
      meetingId: `MEET-${Date.now()}`
    };
    
    onStartMeeting(meetingData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Start New Meeting</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Meeting Title
          </label>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="Enter meeting title..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
            Invite Batches
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {availableBatches.map(batch => (
              <button
                key={batch}
                onClick={() => handleBatchToggle(batch)}
                style={{
                  padding: '12px',
                  border: `2px solid ${selectedBatches.includes(batch) ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  backgroundColor: selectedBatches.includes(batch) ? '#eff6ff' : 'white',
                  color: selectedBatches.includes(batch) ? '#3b82f6' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Users size={14} />
                {batch}
              </button>
            ))}
          </div>
          
          {showCustomInput ? (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={customBatch}
                onChange={(e) => setCustomBatch(e.target.value)}
                placeholder="Enter batch code..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && addCustomBatch()}
              />
              <button
                onClick={addCustomBatch}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              Add Custom Batch
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={startMeeting}
            disabled={!meetingTitle.trim() || selectedBatches.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: !meetingTitle.trim() || selectedBatches.length === 0 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !meetingTitle.trim() || selectedBatches.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} />
            Start Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingInvite;