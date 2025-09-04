import React from 'react';
import { Camera, Eye, Users, Monitor, CheckCircle, X } from 'lucide-react';

const CameraRules = ({ onAccept, onCancel }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '95vh'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            🎥 Camera Rules & Guidelines
          </h2>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '13px' }}>
            Please read and follow these rules during your exam
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Do's */}
          <div>
            <h3 style={{ color: '#10b981', fontSize: '16px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={18} />
              Do's
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                ✅ Keep face clearly visible<br/>
                ✅ Sit in well-lit room<br/>
                ✅ Maintain eye contact with screen<br/>
                ✅ Use stable camera setup<br/>
                ✅ Keep background clear<br/>
                ✅ Stay in camera frame
              </div>
            </div>
          </div>

          {/* Don'ts */}
          <div>
            <h3 style={{ color: '#ef4444', fontSize: '16px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <X size={18} />
              Don'ts
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                ❌ Don't cover or block camera<br/>
                ❌ Don't use virtual backgrounds<br/>
                ❌ Don't allow others in room<br/>
                ❌ Don't use multiple screens<br/>
                ❌ Don't look around excessively<br/>
                ❌ Don't tamper with settings
              </div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#92400e', margin: 0, textAlign: 'center' }}>
            ⚠️ <strong>Important:</strong> Violations may result in exam disqualification
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={onAccept}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraRules;