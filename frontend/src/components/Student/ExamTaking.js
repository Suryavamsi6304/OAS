import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, ChevronLeft, ChevronRight, Send, Code } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ExamCamera from '../Proctoring/ExamCamera';
import CameraRules from '../Proctoring/CameraRules';
import ProctoringMonitor from '../Proctoring/ProctoringMonitor';
import CodeEditor from './CodeEditor';

const ExamTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const proctoringRef = useRef(null);
  const [showCameraRules, setShowCameraRules] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExamBlocked, setIsExamBlocked] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [startTime] = useState(Date.now());

  const { data: exam, isLoading, error } = useQuery(['exam', id], async () => {
    const response = await axios.get(`/api/exams/${id}`);
    return response.data.data;
  }, {
    retry: 1,
    onError: (error) => {
      console.error('Error fetching exam:', error);
      toast.error('Failed to load exam');
    }
  });

  useEffect(() => {
    if (exam?.duration && timeLeft === null) {
      setTimeLeft(exam.duration * 60);
    }
  }, [exam, timeLeft]);

  // Handle exam blocking from proctoring
  const handleViolation = (violation) => {
    console.log('Violation reported:', violation);
  };

  // Listen for exam termination
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'EXAM_TERMINATED') {
        setIsExamBlocked(true);
        toast.error('Exam has been terminated due to violations.');
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Expose proctoring monitor to global scope for violation reporting
  useEffect(() => {
    if (proctoringRef.current) {
      window.proctoringMonitor = proctoringRef.current;
    }
    return () => {
      window.proctoringMonitor = null;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    if (cameraRef.current && cameraRef.current.stopCamera) {
      cameraRef.current.stopCamera();
    }
    if (proctoringRef.current && proctoringRef.current.stopMonitoring) {
      proctoringRef.current.stopMonitoring();
    }

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
    
    try {
      const submissionData = {
        examId: id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        })),
        timeSpent: Math.floor((Date.now() - startTime) / 1000)
      };

      const response = await axios.post('/api/exams/submit', submissionData);
      if (response.data.success) {
        toast.success('Test submitted successfully!');
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        navigate('/learner/results');
      } else {
        toast.error(response.data.message || 'Failed to submit test');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
      setIsSubmitting(false);
    }
  }, [id, answers, startTime, navigate, isSubmitting]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && timeLeft !== null) {
      handleSubmit();
    }
  }, [timeLeft, handleSubmit]);

  // Fullscreen enforcement - Only for skill assessments
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      
      if (!isCurrentlyFullscreen && isFullscreen && !isSubmitting) {
        setShowFullscreenWarning(true);
        
        toast.error('⚠️ Fullscreen violation detected! Please return to fullscreen mode.', {
          duration: 3000,
          position: 'top-center'
        });
        
        if (window.proctoringMonitor && window.proctoringMonitor.reportViolation) {
          window.proctoringMonitor.reportViolation('fullscreen_exit', 'high', 'Student exited fullscreen mode');
        }
      } else if (isCurrentlyFullscreen) {
        setShowFullscreenWarning(false);
      }
    };

    // Only try to enter fullscreen after user interaction (camera rules acceptance)
    if (!showCameraRules && exam && exam.type === 'skill-assessment' && !isFullscreen) {
      // Add a small delay to ensure user gesture context
      setTimeout(() => {
        enterFullscreen();
      }, 100);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [showCameraRules, exam, isFullscreen, isSubmitting]);

  // Anti-cheating measures - Only for skill assessments
  useEffect(() => {
    if (!showCameraRules && exam && exam.type === 'skill-assessment') {
      const preventRightClick = (e) => {
        e.preventDefault();
        toast.error('Right-click is disabled during exam', {
          duration: 2000
        });
        
        if (window.proctoringMonitor && window.proctoringMonitor.reportViolation) {
          window.proctoringMonitor.reportViolation('right_click', 'low', 'Right-click attempt detected');
        }
      };

      const preventKeyboardShortcuts = (e) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 's') ||
          (e.ctrlKey && e.key === 'a') ||
          (e.ctrlKey && e.key === 'c') ||
          (e.ctrlKey && e.key === 'v') ||
          (e.altKey && e.key === 'Tab')
        ) {
          e.preventDefault();
          toast.error('This action is not allowed during exam', {
            duration: 2000
          });
          
          if (window.proctoringMonitor && window.proctoringMonitor.reportViolation) {
            window.proctoringMonitor.reportViolation('suspicious_key', 'medium', `Blocked key combination: ${e.key}`);
          }
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden && !isSubmitting) {
          toast.error('⚠️ Tab switching violation detected!', {
            duration: 3000,
            position: 'top-center'
          });
          
          if (window.proctoringMonitor && window.proctoringMonitor.reportViolation) {
            window.proctoringMonitor.reportViolation('tab_switch', 'high', 'Student switched tabs or minimized window');
          }
        }
      };

      document.addEventListener('contextmenu', preventRightClick);
      document.addEventListener('keydown', preventKeyboardShortcuts);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.mozUserSelect = 'none';
      document.body.style.msUserSelect = 'none';

      return () => {
        document.removeEventListener('contextmenu', preventRightClick);
        document.removeEventListener('keydown', preventKeyboardShortcuts);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        document.body.style.userSelect = 'auto';
        document.body.style.webkitUserSelect = 'auto';
        document.body.style.mozUserSelect = 'auto';
        document.body.style.msUserSelect = 'auto';
      };
    }
  }, [showCameraRules, exam, isSubmitting]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p>Loading exam...</p>
      </div>
    );
  }

  if (showCameraRules) {
    return (
      <div>
        <CameraRules 
          onAccept={() => setShowCameraRules(false)}
          onCancel={() => navigate('/learner')}
        />
        {exam?.type === 'skill-assessment' && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 16px',
            zIndex: 2001,
            fontSize: '14px',
            color: '#166534',
            textAlign: 'center',
            maxWidth: '450px'
          }}>
            ✅ <strong>Proctored Assessment:</strong> Violations are tracked - after 5 violations, exam will be blocked pending mentor approval.
          </div>
        )}
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
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Test Not Available</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>The test you're trying to access is not available.</p>
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

  if (isExamBlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxWidth: '500px'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Exam Terminated</h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Your exam has been terminated due to multiple proctoring violations.
          </p>
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
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {showFullscreenWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          padding: '12px',
          textAlign: 'center',
          zIndex: 9999,
          color: '#dc2626',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          ⚠️ FULLSCREEN VIOLATION - Please press F11 or click the fullscreen button to continue
          <button
            onClick={() => {
              document.documentElement.requestFullscreen().catch(console.error);
            }}
            style={{
              marginLeft: '16px',
              padding: '4px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Enter Fullscreen
          </button>
        </div>
      )}
      
      {exam?.type === 'skill-assessment' && (
        <ProctoringMonitor 
          ref={proctoringRef}
          sessionId={id} 
          onViolation={handleViolation}
        />
      )}
      
      {exam?.type === 'skill-assessment' && <ExamCamera ref={cameraRef} onCameraReady={setCameraReady} examId={id} studentId={user?.id} />}
      
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{exam.title}</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Question {currentQuestion + 1} of {exam.questions.length}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '8px 16px',
              backgroundColor: timeLeft < 300 ? '#fef2f2' : '#f0fdf4',
              borderRadius: '8px',
              border: `1px solid ${timeLeft < 300 ? '#fecaca' : '#bbf7d0'}`
            }}>
              <Clock size={16} style={{ 
                marginRight: '8px', 
                color: timeLeft < 300 ? '#dc2626' : '#059669' 
              }} />
              <span style={{ 
                fontWeight: 'bold',
                color: timeLeft < 300 ? '#dc2626' : '#059669'
              }}>
                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </span>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-success"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Send size={16} style={{ marginRight: '8px' }} />
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
        
        <div style={{ 
          width: '100%', 
          height: '4px', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '2px',
          marginTop: '16px',
          maxWidth: '1200px',
          margin: '16px auto 0'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '2px',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {question.type === 'coding' && <Code size={16} style={{ color: '#3b82f6' }} />}
                <span style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontWeight: '500'
                }}>
                  {question.type.replace('-', ' ')}
                </span>
                {question.type === 'coding' && question.difficulty && (
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: question.difficulty === 'Easy' ? '#dcfce7' : 
                                   question.difficulty === 'Medium' ? '#fef3c7' : '#fecaca',
                    color: question.difficulty === 'Easy' ? '#166534' : 
                           question.difficulty === 'Medium' ? '#92400e' : '#991b1b'
                  }}>
                    {question.difficulty}
                  </span>
                )}
              </div>
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280' 
              }}>
                {question.points} point{question.points !== 1 ? 's' : ''}
              </span>
            </div>
            
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              lineHeight: '1.4',
              margin: 0
            }}>
              {question.title || question.question}
            </h2>
            
            {question.type === 'coding' && question.description && (
              <div style={{ 
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {question.description}
                </div>
                
                {question.constraints && (
                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Constraints:</h4>
                    <div style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                      {question.constraints}
                    </div>
                  </div>
                )}
                
                {question.sampleInput && question.sampleOutput && (
                  <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Sample Input:</h4>
                      <pre style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'white', 
                        padding: '8px', 
                        borderRadius: '4px',
                        margin: 0,
                        border: '1px solid #d1d5db'
                      }}>
                        {question.sampleInput}
                      </pre>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Sample Output:</h4>
                      <pre style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'white', 
                        padding: '8px', 
                        borderRadius: '4px',
                        margin: 0,
                        border: '1px solid #d1d5db'
                      }}>
                        {question.sampleOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '32px' }}>
            {question.type === 'multiple-choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {question.options.map((option) => (
                  <label 
                    key={option._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: answers[question._id] === option._id ? '#eff6ff' : 'white',
                      borderColor: answers[question._id] === option._id ? '#3b82f6' : '#e5e7eb'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={option._id}
                      checked={answers[question._id] === option._id}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ fontSize: '16px' }}>{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'true-false' && (
              <div style={{ display: 'flex', gap: '16px' }}>
                {['true', 'false'].map((option) => (
                  <label 
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 24px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      flex: 1,
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: answers[question._id] === option ? '#eff6ff' : 'white',
                      borderColor: answers[question._id] === option ? '#3b82f6' : '#e5e7eb'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={option}
                      checked={answers[question._id] === option}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '16px', textTransform: 'capitalize' }}>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'essay' && (
              <textarea
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                placeholder="Enter your essay answer here..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            )}

            {question.type === 'coding' && (
              <div style={{ height: '600px', border: '2px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <CodeEditor
                  question={question}
                  initialCode={answers[question._id]?.code || ''}
                  onSubmit={(solution) => {
                    handleAnswerChange(question._id, solution);
                    toast.success('Code solution saved!');
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={16} style={{ marginRight: '8px' }} />
              Previous
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: index === currentQuestion ? '#3b82f6' : 
                                   answers[exam.questions[index]._id] ? '#10b981' : '#e5e7eb',
                    color: index === currentQuestion || answers[exam.questions[index]._id] ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === exam.questions.length - 1}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              Next
              <ChevronRight size={16} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;