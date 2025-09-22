import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CodeEditor = ({ question, onSubmit, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [customInput, setCustomInput] = useState('');

  const languageTemplates = {
    python: `# Write your solution here
def solution():
    # Your code here
    pass

# Call your function
solution()`,
    java: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
        
    }
}`,
    c: `#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (!code || code === languageTemplates[language]) {
      setCode(languageTemplates[newLanguage]);
    }
  };

  const runCode = async (useTestCases = false) => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsRunning(true);
    try {
      const payload = {
        code,
        language,
        input: customInput
      };

      if (useTestCases && question.testCases) {
        payload.testCases = question.testCases.filter(tc => tc.isPublic);
      }

      const response = await axios.post('/api/compiler/execute', payload);
      setResults(response.data);
      
      if (response.data.allPassed) {
        toast.success('All test cases passed!');
      } else {
        toast.error('Some test cases failed');
      }
    } catch (error) {
      toast.error('Failed to run code');
      setResults({ success: false, error: error.response?.data?.message || 'Execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }
    onSubmit({ code, language });
  };

  const resetCode = () => {
    setCode(languageTemplates[language]);
    setResults(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="form-input"
            style={{ width: '120px' }}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>
          
          <button
            onClick={resetCode}
            className="btn btn-secondary"
            style={{ fontSize: '14px', padding: '6px 12px' }}
          >
            <RotateCcw size={14} style={{ marginRight: '6px' }} />
            Reset
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => runCode(false)}
            disabled={isRunning}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Play size={16} style={{ marginRight: '8px' }} />
            {isRunning ? 'Running...' : 'Run'}
          </button>
          
          {question.testCases?.some(tc => tc.isPublic) && (
            <button
              onClick={() => runCode(true)}
              disabled={isRunning}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <CheckCircle size={16} style={{ marginRight: '8px' }} />
              Test
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '14px',
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              lineHeight: '1.5'
            }}
            placeholder="Write your code here..."
          />
          
          {/* Custom Input */}
          <div style={{ 
            borderTop: '1px solid #e5e7eb',
            padding: '12px',
            backgroundColor: '#f8fafc'
          }}>
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
              Custom Input (optional):
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom input for testing..."
              style={{
                width: '100%',
                height: '60px',
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                resize: 'none'
              }}
            />
          </div>
        </div>

        {/* Results Panel */}
        {results && (
          <div style={{ 
            width: '400px',
            borderLeft: '1px solid #e5e7eb',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                Results
                {results.totalTests && (
                  <span style={{ 
                    marginLeft: '8px',
                    fontSize: '12px',
                    color: results.allPassed ? '#059669' : '#dc2626'
                  }}>
                    ({results.passedTests}/{results.totalTests} passed)
                  </span>
                )}
              </h4>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {results.results?.map((result, index) => (
                <div key={index} style={{ 
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: `1px solid ${result.passed && !result.error ? '#10b981' : '#ef4444'}`
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {result.passed && !result.error ? (
                      <CheckCircle size={14} style={{ color: '#10b981', marginRight: '6px' }} />
                    ) : (
                      <XCircle size={14} style={{ color: '#ef4444', marginRight: '6px' }} />
                    )}
                    Test Case {index + 1}
                    {result.executionTime && (
                      <span style={{ marginLeft: 'auto', color: '#6b7280' }}>
                        <Clock size={12} style={{ marginRight: '4px' }} />
                        {result.executionTime.toFixed(2)}ms
                      </span>
                    )}
                  </div>
                  
                  {result.input && (
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Input:</div>
                      <pre style={{ 
                        fontSize: '11px', 
                        backgroundColor: '#f3f4f6', 
                        padding: '6px',
                        borderRadius: '3px',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {result.input}
                      </pre>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Output:</div>
                    <pre style={{ 
                      fontSize: '11px', 
                      backgroundColor: '#f3f4f6', 
                      padding: '6px',
                      borderRadius: '3px',
                      margin: 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {result.actualOutput || result.error || 'No output'}
                    </pre>
                  </div>
                  
                  {result.expectedOutput && (
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Expected:</div>
                      <pre style={{ 
                        fontSize: '11px', 
                        backgroundColor: '#f3f4f6', 
                        padding: '6px',
                        borderRadius: '3px',
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {result.expectedOutput}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div style={{ 
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white',
        textAlign: 'center'
      }}>
        <button
          onClick={handleSubmit}
          className="btn btn-success"
          style={{ fontSize: '16px', padding: '12px 32px' }}
        >
          Submit Solution
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;