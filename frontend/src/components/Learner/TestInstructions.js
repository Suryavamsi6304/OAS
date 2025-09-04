import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Clock, FileText, AlertTriangle, CheckCircle, ArrowLeft, Play } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TestInstructions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const { data: exam, isLoading, error } = useQuery(['exam', id], async () => {
    const response = await axios.get(`/api/exams/${id}`);
    return response.data.data;
  }, {
    retry: false,
    onError: (error) => {
      if (error.response?.status === 403 && error.response?.data?.requiresReAttempt) {
        // Redirect to skill assessments page where the modal will handle re-attempt
        navigate('/learner/skill-assessments');
        toast.error('You have already taken this assessment. Please request a re-attempt.');
      }
    }
  });

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Test Not Found</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>The test you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/learner')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const startTest = () => {
    if (!agreed) {
      toast.error('Please read and agree to the instructions before starting the test');
      return;
    }
    navigate(`/learner/exam/${id}/take`);
  };

  const getTestTypeInfo = () => {
    switch (exam.type) {
      case 'practice':
        return {
          title: 'Practice Test',
          description: 'This is a practice test. You can retake this test multiple times to improve your score.',
          color: '#10b981',
          bgColor: '#dcfce7'
        };
      case 'skill-assessment':
        return {
          title: 'Skill Assessment',
          description: 'This is a skill assessment test. You can only take this test once, so make sure you are prepared.',
          color: '#3b82f6',
          bgColor: '#dbeafe'
        };
      default:
        return {
          title: 'Exam',
          description: 'This is a formal exam. You can only take this test once.',
          color: '#f59e0b',
          bgColor: '#fef3c7'
        };
    }
  };

  const testTypeInfo = getTestTypeInfo();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/learner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div style={{
            padding: '16px',
            backgroundColor: testTypeInfo.bgColor,
            borderRadius: '8px',
            border: `1px solid ${testTypeInfo.color}20`,
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={20} style={{ color: testTypeInfo.color }} />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: testTypeInfo.color,
                textTransform: 'uppercase'
              }}>
                {testTypeInfo.title}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
              {testTypeInfo.description}
            </p>
          </div>
        </div>

        {/* Test Overview Card */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>
                {exam.title}
              </h1>
              {exam.description && (
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  {exam.description}
                </p>
              )}
            </div>
            
            {/* Key Stats - Horizontal */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{exam.duration}min</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Duration</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{exam.questions?.length || 0}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Questions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{exam.totalPoints || 0}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Points</div>
              </div>
              {exam.passingScore && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{exam.passingScore}%</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>Pass</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Alerts Row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {exam.negativeMarking && (
              <div style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                fontSize: '12px'
              }}>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>⚠️ Negative Marking: </span>
                <span style={{ color: '#7f1d1d' }}>-{exam.negativeMarkingValue || 0.25} pts for wrong answers</span>
              </div>
            )}
            
            <div style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: exam.type === 'practice' ? '#f0fdf4' : '#fef2f2',
              borderRadius: '6px',
              border: `1px solid ${exam.type === 'practice' ? '#bbf7d0' : '#fecaca'}`,
              fontSize: '12px'
            }}>
              <span style={{ color: exam.type === 'practice' ? '#059669' : '#dc2626', fontWeight: '600' }}>
                {exam.type === 'practice' ? '✅ Practice Mode: ' : '❌ Single Attempt: '}
              </span>
              <span style={{ color: exam.type === 'practice' ? '#166534' : '#7f1d1d' }}>
                {exam.type === 'practice' ? 'Retake allowed' : 'One chance only'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          
          {/* Preparation */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚀 Get Ready
            </h3>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
              • Stable internet connection<br/>
              • Close unnecessary tabs<br/>
              • Quiet environment<br/>
              • Device charged/plugged in
            </div>
          </div>

          {/* Test Rules */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⏱️ Test Rules
            </h3>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
              • {exam.duration} minutes total time<br/>
              • Auto-save your progress<br/>
              • Navigate with Prev/Next<br/>
              • Auto-submit at time end
              {exam.negativeMarking && (
                <><br/><span style={{ color: '#ef4444', fontWeight: '500' }}>• Wrong = -{exam.negativeMarkingValue || 0.25} points</span></>
              )}
            </div>
          </div>

          {/* Question Info */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📝 Question Types
            </h3>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
              • Multiple Choice<br/>
              • True/False<br/>
              • Essay Questions<br/>
              • Code Problems
            </div>
          </div>

          {/* Important Notes */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Remember
            </h3>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
              • Don't refresh the page<br/>
              • Don't navigate away<br/>
              • Submit before time ends<br/>
              • Results shown immediately
            </div>
          </div>
        </div>

        {/* Agreement and Start */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ 
                  marginTop: '2px',
                  width: '18px',
                  height: '18px'
                }}
              />
              <span>
                I have read and understood all the instructions above. I agree to follow the test guidelines 
                and understand that any violation may result in test cancellation. I am ready to start the test.
              </span>
            </label>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={startTest}
              disabled={!agreed}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                backgroundColor: agreed ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: agreed ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 auto',
                transition: 'all 0.2s'
              }}
            >
              <Play size={20} />
              Start Test
            </button>
            
            {!agreed && (
              <p style={{ 
                marginTop: '12px', 
                fontSize: '14px', 
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Please read and agree to the instructions to start the test
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;