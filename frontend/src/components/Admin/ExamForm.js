import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import CodingQuestionForm from './CodingQuestionForm';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ExamForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCodingForm, setShowCodingForm] = useState(false);
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      duration: 60,
      isActive: true,
      questions: [{
        type: 'multiple-choice',
        question: '',
        points: 1,
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }]
    }
  });

  const { fields: questions, append: addQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions'
  });

  const watchedQuestions = watch('questions');

  const addOption = (questionIndex) => {
    const currentOptions = watchedQuestions[questionIndex].options || [];
    const newOptions = [...currentOptions, { text: '', isCorrect: false }];
    
    // Update the form data
    const updatedQuestions = [...watchedQuestions];
    updatedQuestions[questionIndex].options = newOptions;
  };

  const removeOption = (questionIndex, optionIndex) => {
    const currentOptions = watchedQuestions[questionIndex].options || [];
    if (currentOptions.length <= 2) return; // Keep at least 2 options
    
    const newOptions = currentOptions.filter((_, index) => index !== optionIndex);
    const updatedQuestions = [...watchedQuestions];
    updatedQuestions[questionIndex].options = newOptions;
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Calculate total points
      const totalPoints = data.questions.reduce((sum, q) => sum + parseInt(q.points), 0);
      
      const examData = {
        ...data,
        totalPoints,
        questions: data.questions.map((q, index) => ({
          ...q,
          _id: `q${index + 1}`,
          points: parseInt(q.points),
          options: q.type === 'multiple-choice' ? q.options.map((opt, optIndex) => ({
            ...opt,
            _id: `opt${optIndex + 1}`
          })) : undefined
        }))
      };

      await api.post('/api/exams', examData);
      toast.success('Exam created successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Exam">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/admin')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Info */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
              Exam Information
            </h2>
            
            <div className="form-group">
              <label className="form-label">Exam Title</label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="form-input"
                placeholder="Enter exam title"
              />
              {errors.title && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                className="form-input"
                rows="3"
                placeholder="Enter exam description"
              />
              {errors.description && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                  {errors.description.message}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                  {...register('duration', { 
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 minute' }
                  })}
                  type="number"
                  className="form-input"
                  min="1"
                />
                {errors.duration && (
                  <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                    {errors.duration.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select {...register('isActive')} className="form-input">
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                Questions ({questions.length})
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => addQuestion({
                    type: 'multiple-choice',
                    question: '',
                    points: 1,
                    options: [
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false }
                    ]
                  })}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Plus size={16} style={{ marginRight: '8px' }} />
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodingForm(true)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Plus size={16} style={{ marginRight: '8px' }} />
                  Add Coding Question
                </button>
              </div>
            </div>

            {showCodingForm && (
              <CodingQuestionForm
                onSave={(codingQuestion) => {
                  addQuestion(codingQuestion);
                  setShowCodingForm(false);
                }}
                onCancel={() => setShowCodingForm(false)}
              />
            )}

            {questions.map((question, questionIndex) => (
              <div 
                key={question.id} 
                className="card" 
                style={{ 
                  margin: '0 0 24px 0', 
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f8fafc'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Question {questionIndex + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Question Type</label>
                    <select 
                      {...register(`questions.${questionIndex}.type`)} 
                      className="form-input"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="essay">Essay</option>
                      <option value="coding">Coding</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Points</label>
                    <input
                      {...register(`questions.${questionIndex}.points`, { 
                        required: 'Points required',
                        min: { value: 1, message: 'Min 1 point' }
                      })}
                      type="number"
                      className="form-input"
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea
                    {...register(`questions.${questionIndex}.question`, { 
                      required: 'Question text is required' 
                    })}
                    className="form-input"
                    rows="3"
                    placeholder="Enter your question here..."
                  />
                </div>

                {/* Options for Multiple Choice */}
                {watchedQuestions[questionIndex]?.type === 'multiple-choice' && (
                  <div>
                    <label className="form-label">Answer Options</label>
                    {watchedQuestions[questionIndex].options?.map((option, optionIndex) => (
                      <div 
                        key={optionIndex}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          marginBottom: '8px'
                        }}
                      >
                        <input
                          {...register(`questions.${questionIndex}.options.${optionIndex}.isCorrect`)}
                          type="radio"
                          name={`question-${questionIndex}-correct`}
                        />
                        <input
                          {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                          type="text"
                          className="form-input"
                          placeholder={`Option ${optionIndex + 1}`}
                          style={{ flex: 1 }}
                        />
                        {watchedQuestions[questionIndex].options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(questionIndex)}
                      className="btn btn-secondary"
                      style={{ fontSize: '14px', padding: '4px 12px' }}
                    >
                      Add Option
                    </button>
                  </div>
                )}

                {/* True/False Answer */}
                {watchedQuestions[questionIndex]?.type === 'true-false' && (
                  <div>
                    <label className="form-label">Correct Answer</label>
                    <select 
                      {...register(`questions.${questionIndex}.correctAnswer`)} 
                      className="form-input"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                )}

                {/* Coding Question Details */}
                {watchedQuestions[questionIndex]?.type === 'coding' && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Difficulty</label>
                        <p style={{ margin: 0, fontWeight: '600' }}>{watchedQuestions[questionIndex].difficulty}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Time Limit</label>
                        <p style={{ margin: 0, fontWeight: '600' }}>{watchedQuestions[questionIndex].timeLimit}s</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Test Cases</label>
                        <p style={{ margin: 0, fontWeight: '600' }}>{watchedQuestions[questionIndex].testCases?.length || 0}</p>
                      </div>
                    </div>
                    {watchedQuestions[questionIndex].sampleInput && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Sample Input</label>
                          <pre style={{ fontSize: '11px', backgroundColor: 'white', padding: '8px', borderRadius: '4px', margin: '4px 0 0 0' }}>
                            {watchedQuestions[questionIndex].sampleInput}
                          </pre>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Sample Output</label>
                          <pre style={{ fontSize: '11px', backgroundColor: 'white', padding: '8px', borderRadius: '4px', margin: '4px 0 0 0' }}>
                            {watchedQuestions[questionIndex].sampleOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ 
                fontSize: '16px', 
                padding: '12px 32px',
                display: 'flex',
                alignItems: 'center',
                margin: '0 auto'
              }}
            >
              <Save size={16} style={{ marginRight: '8px' }} />
              {isSubmitting ? 'Creating Exam...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ExamForm;