import React from 'react';
import { Video, Clock, Users, X } from 'lucide-react';

const MeetingNotification = ({ meeting, onJoin, onDecline }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      width: '320px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '2px solid #10b981',
      zIndex: 1001,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>LIVE MEETING</span>
        </div>
        <button onClick={onDecline} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={16} />
        </button>
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
        {meeting.title}
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', fontSize: '13px', color: '#6b7280' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={12} />
          <span>Batch: {meeting.batches.join(', ')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} />
          <span>Started: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onDecline}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          Decline
        </button>
        <button
          onClick={() => onJoin(meeting)}
          style={{
            flex: 2,
            padding: '10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Video size={14} />
          Join Meeting
        </button>
      </div>
    </div>
  );
};

export default MeetingNotification;