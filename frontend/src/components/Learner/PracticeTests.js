import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Play, CheckCircle } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';

const PracticeTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPracticeTests();
  }, []);

  const fetchPracticeTests = async () => {
    try {
      const response = await axios.get('/api/practice-tests');
      setTests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching practice tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTest = (testId) => {
    window.location.href = `/learner/test/${testId}`;
  };

  return (
    <DashboardLayout title="Practice Tests">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Practice Tests
          </h1>
          <p style={{ color: '#6b7280' }}>
            Improve your skills with our practice tests
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p>Loading practice tests...</p>
          </div>
        ) : tests.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {tests.map((test) => (
              <div key={test.id} className="card" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {test.title}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    {test.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <BookOpen size={16} style={{ marginRight: '8px' }} />
                    {test.questionCount || 10} Questions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <Clock size={16} style={{ marginRight: '8px' }} />
                    {test.duration || 30} Minutes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <CheckCircle size={16} style={{ marginRight: '8px' }} />
                    Difficulty: {test.difficulty || 'Medium'}
                  </div>
                </div>

                <button
                  onClick={() => startTest(test.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Play size={16} style={{ marginRight: '8px' }} />
                  Start Test
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No practice tests available at the moment.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PracticeTests;