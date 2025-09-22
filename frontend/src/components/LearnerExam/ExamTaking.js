import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, ChevronLeft, ChevronRight, Send, Code, Camera, CameraOff } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

import CodeEditor from './CodeEditor';
import DraggableVideoPreview from './DraggableVideoPreview';
import proctoringService from '../../utils/proctoringService';


const ExamTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCameraRules, setShowCameraRules] = useState(false);
  const [startTime] = useState(Date.now());
  const [proctoringStream, setProctoringStream] = useState(null);
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [showProctoringSetup, setShowProctoringSetup] = useState(true);
  const [violations, setViolations] = useState([]);

  const { data: exam, isLoading, error } = useQuery(['exam', id], async () => {
    const response = await api.get(`/api/exams/${id}`);
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

  // Initialize proctoring when exam loads
  useEffect(() => {
    if (exam && user && !proctoringStream) {
      initializeProctoring();
    }
    
    return () => {
      if (proctoringStream) {
        proctoringService.stopStreaming();
      }
    };
  }, [exam, user]);

  // Keyboard violation detection
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, altKey, key, metaKey } = event;
      
      // Detect prohibited key combinations
      if (ctrlKey || altKey || metaKey) {
        const violation = {
          id: Date.now(),
          type: 'keyboard_violation',
          timestamp: new Date().toISOString(),
          details: `Prohibited key combination: ${ctrlKey ? 'Ctrl+' : ''}${altKey ? 'Alt+' : ''}${metaKey ? 'Cmd+' : ''}${key}`,
          severity: 'high'
        };
        
        setViolations(prev => [...prev, violation]);
        
        // Show warning toast
        toast.error(`⚠️ Violation detected: ${violation.details}`, {
          duration: 3000,
          style: {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca'
          }
        });
        
        // Prevent the action
        event.preventDefault();
        event.stopPropagation();
        
        // Log violation to backend if proctoring is active
        if (isProctoringActive) {
          logViolation(violation);
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isProctoringActive]);

  // Fullscreen monitoring
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen request failed:', error.message);
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      
      if (!isFullscreen && exam && !showProctoringSetup) {
        // User exited fullscreen during exam
        const violation = {
          id: Date.now(),
          type: 'fullscreen_violation',
          timestamp: new Date().toISOString(),
          details: 'Exited fullscreen mode during exam',
          severity: 'high'
        };
        
        console.log('Fullscreen violation detected:', violation);
        setViolations(prev => [...prev, violation]);
        
        if (isProctoringActive) {
          logViolation(violation);
        }
        
        // Force back to fullscreen after 3 seconds
        setTimeout(() => {
          console.log('Forcing back to fullscreen');
          enterFullscreen();
        }, 3000);
      }
    };

    // Store enterFullscreen function globally for user interaction
    window.enterExamFullscreen = enterFullscreen;

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [exam, showProctoringSetup, isProctoringActive]);
  
  const logViolation = async (violation) => {
    try {
      await api.post('/api/violations/log', {
        examId: id,
        studentId: user.id,
        violation
      });
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  };

  const initializeProctoring = async () => {
    try {
      const stream = await proctoringService.initialize(exam.id, user.id);
      setProctoringStream(stream);
      toast.success('Camera access granted for proctoring');
    } catch (error) {
      console.error('Failed to initialize proctoring:', error);
      toast.error('Camera access required for this exam');
    }
  };

  const startProctoring = async () => {
    try {
      await proctoringService.startStreaming(exam.id, user.id, user.name || user.username, exam.title);
      setIsProctoringActive(true);
      setShowProctoringSetup(false);
      toast.success('Proctoring started - you are now being monitored');
    } catch (error) {
      console.error('Failed to start proctoring:', error);
      toast.error('Failed to start proctoring');
    }
  };





  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Stop proctoring before submission
    if (isProctoringActive) {
      proctoringService.stopStreaming();
      setIsProctoringActive(false);
    }
    
    // Exit fullscreen on submission
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
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

      const response = await api.post('/api/exams/submit', submissionData);
      if (response.data.success) {
        toast.success('Test submitted successfully!');

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

  // Show proctoring setup modal
  if (showProctoringSetup && proctoringStream) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <Camera size={48} style={{ color: '#3b82f6', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Proctoring Setup</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
            This exam requires proctoring. Your video will be monitored by mentors during the test. 
            Please ensure you are in a quiet, well-lit environment and remain visible throughout the exam.
          </p>
          
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Proctoring Rules:</h4>
            <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>Keep your face visible at all times</li>
              <li>Do not leave your seat during the exam</li>
              <li>No additional people should be in the room</li>
              <li>Keep your hands visible while typing</li>
              <li>Do not use external devices or materials</li>
            </ul>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/learner')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await window.enterExamFullscreen?.();
                startProctoring();
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Camera size={16} />
              Start Proctored Exam
            </button>
          </div>
        </div>
      </div>
    );
  }



  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Draggable Video Preview */}
      {proctoringStream && (
        <DraggableVideoPreview
          stream={proctoringStream}
          isRecording={isProctoringActive}
        />
      )}

      


      

      
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
            {/* Proctoring Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: isProctoringActive ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: `1px solid ${isProctoringActive ? '#bbf7d0' : '#fecaca'}`
            }}>
              {isProctoringActive ? <Camera size={16} /> : <CameraOff size={16} />}
              <span style={{
                marginLeft: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: isProctoringActive ? '#059669' : '#dc2626'
              }}>
                {isProctoringActive ? 'MONITORED' : 'NOT MONITORED'}
              </span>
            </div>
            
            {/* Violations Counter */}
            {violations.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}>
                  ⚠️ {violations.length} Violation{violations.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
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