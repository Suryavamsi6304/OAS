import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, MessageSquare, Bell, Users } from 'lucide-react';

const CommNav = ({ userRole, userBatch }) => {
  const navigate = useNavigate();

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '50px',
          padding: '8px',
          display: 'flex',
          gap: '4px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb'
        }}>
          <button style={{
            position: 'relative',
            padding: '12px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f8fafc',
            cursor: 'pointer'
          }}>
            <MessageSquare size={18} color="#6b7280" />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </button>

          <button
            onClick={() => navigate('/communication')}
            style={{
              padding: '12px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#10b981',
              cursor: 'pointer'
            }}
          >
            <Video size={18} color="white" />
          </button>

          <button style={{
            padding: '12px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f8fafc',
            cursor: 'pointer'
          }}>
            <Bell size={18} color="#6b7280" />
          </button>

          <button style={{
            padding: '12px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f8fafc',
            cursor: 'pointer'
          }}>
            <Users size={18} color="#6b7280" />
          </button>
        </div>
      </div>


    </>
  );
};

export default CommNav;