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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

        {/* Test Information */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            {exam.title}
          </h1>
          
          {exam.description && (
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
              {exam.description}
            </p>
          )}

          {/* Test Details Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <Clock size={24} style={{ color: '#3b82f6', margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {exam.duration} minutes
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Time Limit</p>
            </div>

            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <FileText size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {exam.questions?.length || 0} questions
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Total Questions</p>
            </div>

            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <CheckCircle size={24} style={{ color: '#f59e0b', margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                {exam.totalPoints || 0} points
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Total Points</p>
            </div>

            {exam.passingScore && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <AlertTriangle size={24} style={{ color: '#ef4444', margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {exam.passingScore}%
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Passing Score</p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          {exam.negativeMarking && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>Negative Marking</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d' }}>
                Wrong answers will deduct {exam.negativeMarkingValue || 0.25} points from your total score.
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
            Test Instructions
          </h2>

          <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                Before You Start:
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '4px' }}>Ensure you have a stable internet connection</li>
                <li style={{ marginBottom: '4px' }}>Close all unnecessary applications and browser tabs</li>
                <li style={{ marginBottom: '4px' }}>Find a quiet environment free from distractions</li>
                <li style={{ marginBottom: '4px' }}>Make sure your device is fully charged or plugged in</li>
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                During the Test:
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '4px' }}>You have {exam.duration} minutes to complete all {exam.questions?.length || 0} questions</li>
                <li style={{ marginBottom: '4px' }}>You can navigate between questions using the Previous/Next buttons</li>
                <li style={{ marginBottom: '4px' }}>Your progress is automatically saved as you answer questions</li>
                <li style={{ marginBottom: '4px' }}>The timer will be visible at the top of the screen</li>
                <li style={{ marginBottom: '4px' }}>The test will auto-submit when time expires</li>
                {exam.negativeMarking && (
                  <li style={{ marginBottom: '4px', color: '#ef4444' }}>
                    <strong>Negative marking is enabled:</strong> Wrong answers will deduct {exam.negativeMarkingValue || 0.25} points
                  </li>
                )}
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                Question Types:
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '4px' }}>
                  <strong>Multiple Choice:</strong> Select the best answer from the given options
                </li>
                <li style={{ marginBottom: '4px' }}>
                  <strong>True/False:</strong> Choose whether the statement is true or false
                </li>
                <li style={{ marginBottom: '4px' }}>
                  <strong>Essay:</strong> Provide detailed written answers
                </li>
                <li style={{ marginBottom: '4px' }}>
                  <strong>Coding:</strong> Write code solutions to programming problems
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                Important Notes:
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '4px' }}>
                  {exam.type === 'practice' 
                    ? 'This is a practice test - you can retake it multiple times'
                    : 'You can only take this test once, so make sure you are prepared'
                  }
                </li>
                <li style={{ marginBottom: '4px' }}>Do not refresh the page or navigate away during the test</li>
                <li style={{ marginBottom: '4px' }}>Submit your test before the time expires</li>
                <li style={{ marginBottom: '4px' }}>Results will be available immediately after submission</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agreement and Start */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
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