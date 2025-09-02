import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreatePracticeTest = () => {
  const navigate = useNavigate();
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    duration: 30,
    totalQuestions: 5,
    negativeMarking: false,
    negativeMarkingValue: 0.25,
    passingScore: 70,
    isActive: true,
    type: 'practice'
  });
  const [questions, setQuestions] = useState([]);
  const [isQuestionsGenerated, setIsQuestionsGenerated] = useState(false);

  const generateQuestions = () => {
    const newQuestions = [];
    for (let i = 0; i < testData.totalQuestions; i++) {
      newQuestions.push({
        type: 'multiple-choice',
        question: '',
        points: 1,
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      });
    }
    setQuestions(newQuestions);
    setIsQuestionsGenerated(true);
  };

  const regenerateQuestions = () => {
    if (window.confirm(`This will reset all ${questions.length} questions. Are you sure?`)) {
      generateQuestions();
    }
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addOption = (questionIndex) => {
    const updated = [...questions];
    updated[questionIndex].options.push({ text: '', isCorrect: false });
    setQuestions(updated);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
      setQuestions(updated);
    }
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const updated = [...questions];
    if (field === 'isCorrect' && value) {
      // Only one correct answer for MCQ
      updated[questionIndex].options.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex;
      });
    } else {
      updated[questionIndex].options[optionIndex][field] = value;
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    // Validate basic info
    if (!testData.title.trim()) {
      toast.error('Please enter a test title');
      return;
    }
    if (!testData.description.trim()) {
      toast.error('Please enter a test description');
      return;
    }

    // Validate all questions are filled
    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      toast.error(`Please fill all ${questions.length} questions before submitting`);
      return;
    }

    // Validate MCQ questions have correct answers and options
    const mcqWithoutAnswer = questions.filter(q => 
      q.type === 'multiple-choice' && !q.options.some(opt => opt.isCorrect)
    );
    if (mcqWithoutAnswer.length > 0) {
      toast.error('Please select correct answers for all multiple choice questions');
      return;
    }

    // Validate MCQ options are filled
    const mcqWithEmptyOptions = questions.filter(q => 
      q.type === 'multiple-choice' && q.options.some(opt => !opt.text.trim())
    );
    if (mcqWithEmptyOptions.length > 0) {
      toast.error('Please fill all option texts for multiple choice questions');
      return;
    }

    // Validate True/False questions have correct answers
    const tfWithoutAnswer = questions.filter(q => 
      q.type === 'true-false' && !q.correctAnswer
    );
    if (tfWithoutAnswer.length > 0) {
      toast.error('Please select correct answers for all true/false questions');
      return;
    }

    try {
      const totalPoints = questions.reduce((sum, q) => sum + parseInt(q.points), 0);
      
      const practiceTest = {
        ...testData,
        questions: questions.map((q, index) => ({
          ...q,
          _id: `q${index + 1}`,
          points: parseInt(q.points),
          options: q.type === 'multiple-choice' ? q.options.map((opt, optIndex) => ({
            ...opt,
            _id: `opt${optIndex + 1}`
          })) : undefined
        })),
        totalPoints
      };

      const response = await axios.post('/api/practice-tests', practiceTest);
      if (response.data.success) {
        toast.success('Practice test created successfully!');
        navigate('/mentor');
      } else {
        toast.error(response.data.message || 'Failed to create practice test');
      }
    } catch (error) {
      console.error('Error creating practice test:', error);
      toast.error(error.response?.data?.message || 'Failed to create practice test');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/mentor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>

        {/* Basic Info */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Practice Test Information</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Title</label>
              <input
                value={testData.title}
                onChange={(e) => setTestData({...testData, title: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                placeholder="Enter test title"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Difficulty</label>
              <select
                value={testData.difficulty}
                onChange={(e) => setTestData({...testData, difficulty: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Description</label>
            <textarea
              value={testData.description}
              onChange={(e) => setTestData({...testData, description: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px' }}
              placeholder="Enter test description"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>No. of Questions</label>
              <input
                type="number"
                value={testData.totalQuestions}
                onChange={(e) => setTestData({...testData, totalQuestions: parseInt(e.target.value) || 1})}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                min="1"
                max="50"
                disabled={isQuestionsGenerated}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Duration (minutes)</label>
              <input
                type="number"
                value={testData.duration}
                onChange={(e) => setTestData({...testData, duration: parseInt(e.target.value) || 1})}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                min="1"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Passing Score (%)</label>
              <input
                type="number"
                value={testData.passingScore}
                onChange={(e) => setTestData({...testData, passingScore: parseInt(e.target.value) || 0})}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <input
                  type="checkbox"
                  checked={testData.negativeMarking}
                  onChange={(e) => setTestData({...testData, negativeMarking: e.target.checked})}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Negative Marking</span>
              </label>
            </div>
          </div>

          {testData.negativeMarking && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Negative Marking Value</label>
              <input
                type="number"
                step="0.25"
                value={testData.negativeMarkingValue}
                onChange={(e) => setTestData({...testData, negativeMarkingValue: parseFloat(e.target.value)})}
                style={{ width: '200px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                min="0"
                max="1"
              />
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>points deducted per wrong answer</span>
            </div>
          )}
        </div>

        {/* Questions */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Questions ({questions.length}/{testData.totalQuestions})</h2>
            {!isQuestionsGenerated ? (
              <button
                onClick={generateQuestions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Generate {testData.totalQuestions} Questions
              </button>
            ) : (
              <button
                onClick={regenerateQuestions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Regenerate Questions
              </button>
            )}
          </div>

          {!isQuestionsGenerated && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              border: '2px dashed #d1d5db'
            }}>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>Click "Generate Questions" to create {testData.totalQuestions} question slots</p>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>You must fill all {testData.totalQuestions} questions before publishing the test</p>
            </div>
          )}

          {isQuestionsGenerated && questions.map((question, qIndex) => (
            <div key={qIndex} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    style={{ padding: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="essay">Essay</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Points</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    min="1"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Question Text</label>
                <textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px' }}
                  placeholder="Enter your question here..."
                />
              </div>

              {/* Options for Multiple Choice */}
              {question.type === 'multiple-choice' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>Answer Options</label>
                    <button
                      onClick={() => addOption(qIndex)}
                      style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Add Option
                    </button>
                  </div>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <input
                        type="radio"
                        name={`question-${qIndex}-correct`}
                        checked={option.isCorrect}
                        onChange={() => updateOption(qIndex, optIndex, 'isCorrect', true)}
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(qIndex, optIndex, 'text', e.target.value)}
                        style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <button
                          onClick={() => removeOption(qIndex, optIndex)}
                          style={{ padding: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* True/False Answer */}
              {question.type === 'true-false' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Correct Answer</label>
                  <select
                    value={question.correctAnswer || 'true'}
                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                    style={{ width: '200px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}
            </div>
          ))}

          {isQuestionsGenerated && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
                  ✅ Progress: {questions.filter(q => q.question.trim()).length}/{testData.totalQuestions} questions completed
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={questions.filter(q => q.question.trim()).length !== testData.totalQuestions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: questions.filter(q => q.question.trim()).length === testData.totalQuestions ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: questions.filter(q => q.question.trim()).length === testData.totalQuestions ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  margin: '0 auto'
                }}
              >
                <Save size={16} />
                Create Practice Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePracticeTest;