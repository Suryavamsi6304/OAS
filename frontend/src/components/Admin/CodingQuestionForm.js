import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, Play } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CodingQuestionForm = ({ onSave, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'Easy',
      timeLimit: 30,
      memoryLimit: 256,
      sampleInput: '',
      sampleOutput: '',
      constraints: '',
      points: 10,
      testCases: [
        { input: '', expectedOutput: '', isPublic: true },
        { input: '', expectedOutput: '', isPublic: false }
      ]
    }
  });

  const { fields: testCases, append: addTestCase, remove: removeTestCase } = useFieldArray({
    control,
    name: 'testCases'
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      onSave({
        ...data,
        type: 'coding',
        testCases: data.testCases.filter(tc => tc.input && tc.expectedOutput)
      });
      toast.success('Coding question added successfully!');
    } catch (error) {
      toast.error('Failed to add coding question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ margin: '24px 0' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Add Coding Question
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Question Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="form-input"
              placeholder="e.g., Two Sum Problem"
            />
            {errors.title && <p style={{ color: '#ef4444', fontSize: '12px' }}>{errors.title.message}</p>}
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Difficulty</label>
            <select {...register('difficulty')} className="form-input">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Points</label>
            <input
              {...register('points', { required: true, min: 1 })}
              type="number"
              className="form-input"
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Problem Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            className="form-input"
            rows="4"
            placeholder="Describe the problem statement..."
          />
          {errors.description && <p style={{ color: '#ef4444', fontSize: '12px' }}>{errors.description.message}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Sample Input</label>
            <textarea
              {...register('sampleInput')}
              className="form-input"
              rows="3"
              placeholder="Sample input for the problem"
            />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Sample Output</label>
            <textarea
              {...register('sampleOutput')}
              className="form-input"
              rows="3"
              placeholder="Expected output for sample input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Constraints</label>
          <textarea
            {...register('constraints')}
            className="form-input"
            rows="2"
            placeholder="Input constraints and limits"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Time Limit (seconds)</label>
            <input
              {...register('timeLimit', { min: 1 })}
              type="number"
              className="form-input"
              min="1"
            />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Memory Limit (MB)</label>
            <input
              {...register('memoryLimit', { min: 1 })}
              type="number"
              className="form-input"
              min="1"
            />
          </div>
        </div>

        {/* Test Cases */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
              Test Cases ({testCases.length})
            </h4>
            <button
              type="button"
              onClick={() => addTestCase({ input: '', expectedOutput: '', isPublic: false })}
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '6px 12px' }}
            >
              <Plus size={14} style={{ marginRight: '6px' }} />
              Add Test Case
            </button>
          </div>

          {testCases.map((testCase, index) => (
            <div key={testCase.id} className="card" style={{ 
              margin: '0 0 16px 0', 
              padding: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  Test Case {index + 1}
                </h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <input
                      {...register(`testCases.${index}.isPublic`)}
                      type="checkbox"
                      style={{ marginRight: '6px' }}
                    />
                    Public (visible to students)
                  </label>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Input</label>
                  <textarea
                    {...register(`testCases.${index}.input`)}
                    className="form-input"
                    rows="3"
                    placeholder="Test input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Expected Output</label>
                  <textarea
                    {...register(`testCases.${index}.expectedOutput`)}
                    className="form-input"
                    rows="3"
                    placeholder="Expected output"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Save size={16} style={{ marginRight: '8px' }} />
            {isSubmitting ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CodingQuestionForm;