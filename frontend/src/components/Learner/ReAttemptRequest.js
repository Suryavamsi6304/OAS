import React, { useState } from 'react';
import { AlertCircle, Send, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReAttemptRequest = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for retaking this exam');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/re-attempt/request', {
        examId,
        reason: reason.trim()
      });

      if (response.data.success) {
        toast.success('Re-attempt request sent to mentor for approval');
        navigate('/learner/re-attempts');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send re-attempt request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#6b7280'
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back
        </button>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <AlertCircle size={24} style={{ color: '#f59e0b', marginRight: '12px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Request Re-attempt
            </h1>
          </div>

          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#92400e', margin: 0, fontSize: '14px' }}>
              You have already taken this exam. To retake it, you need approval from your mentor.
              Please provide a valid reason for your request.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Reason for Re-attempt *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need to retake this exam..."
                required
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isSubmitting || !reason.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSubmitting || !reason.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Send size={16} style={{ marginRight: '8px' }} />
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReAttemptRequest;