import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Clock, ChevronLeft, ChevronRight, Flag, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProctoringSetup from '../Proctoring/ProctoringSetup';
import ProctoringMonitor from '../Proctoring/ProctoringMonitor';

const ExamTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proctoringSession, setProctoringSession] = useState(null);
  const [showProctoringSetup, setShowProctoringSetup] = useState(false);
  const proctoringMonitorRef = useRef(null);

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
    
    // Check if proctoring is enabled
    if (exam?.proctoringEnabled && !proctoringSession) {
      setShowProctoringSetup(true);
    }
  }, [exam, timeLeft, proctoringSession]);

  // Start time tracking
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && timeLeft !== null) {
      handleSubmit();
    }
  }, [timeLeft]);

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

  const handleProctoringSetupComplete = (sessionData) => {
    setProctoringSession(sessionData);
    setShowProctoringSetup(false);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
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
        // Stop proctoring monitoring
        if (proctoringMonitorRef.current) {
          proctoringMonitorRef.current.stopMonitoring();
        }
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

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  // Show proctoring setup if required
  if (showProctoringSetup) {
    return (
      <ProctoringSetup 
        examId={id}
        onSetupComplete={handleProctoringSetupComplete}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Proctoring Monitor */}
      {proctoringSession && (
        <ProctoringMonitor 
          ref={proctoringMonitorRef}
          sessionId={proctoringSession.sessionId}
          examId={id}
        />
      )}
      {/* Header */}
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
        
        {/* Progress Bar */}
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

      {/* Question Content */}
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
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                textTransform: 'uppercase',
                fontWeight: '500'
              }}>
                {question.type.replace('-', ' ')}
              </span>
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
              {question.question}
            </h2>
          </div>

          {/* Answer Options */}
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

            {(question.type === 'essay' || question.type === 'coding') && (
              <textarea
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                placeholder={`Enter your ${question.type} answer here...`}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: question.type === 'coding' ? 'monospace' : 'inherit',
                  resize: 'vertical'
                }}
              />
            )}
          </div>

          {/* Navigation */}
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