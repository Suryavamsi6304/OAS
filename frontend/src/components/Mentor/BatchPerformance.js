import React from 'react';
import { useQuery } from 'react-query';
import { Users, Trophy } from 'lucide-react';
import api from '../../utils/api';

const BatchPerformance = () => {
  const { data: performanceData, isLoading } = useQuery('batch-performance', async () => {
    const response = await api.get('/api/results/batch-performance');
    return response.data.data || { batches: {}, stats: {} };
  });

  const batchData = performanceData?.batches || {};
  const batchStats = performanceData?.stats || {};

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p>Loading batch performance...</p>
      </div>
    );
  }

  const batches = Object.keys(batchData || {});

  if (batches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>No performance data available.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Batch-wise Learner Performance
      </h2>
      
      {batches.map(batchCode => {
        const examTypes = Object.keys(batchData[batchCode] || {});
        return (
          <div key={batchCode} className="card" style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <Users size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                {batchCode}
              </h3>
            </div>
            
            {examTypes.map(questionType => {
              const stats = batchStats[batchCode][questionType] || {};
              const results = batchData[batchCode][questionType] || [];
              
              return (
                <div key={questionType} style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: questionType === 'MCQ' ? '#dbeafe' : 
                                   questionType === 'Coding' ? '#dcfce7' :
                                   questionType === 'Essay' ? '#fef3c7' :
                                   questionType === 'True/False' ? '#f3e8ff' : '#f1f5f9',
                    borderRadius: '6px'
                  }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      margin: 0,
                      color: questionType === 'MCQ' ? '#1e40af' : 
                             questionType === 'Coding' ? '#166534' :
                             questionType === 'Essay' ? '#92400e' :
                             questionType === 'True/False' ? '#7c3aed' : '#475569'
                    }}>
                      {questionType === 'MCQ' ? '📝 Multiple Choice Questions' : 
                       questionType === 'Coding' ? '💻 Coding Questions' :
                       questionType === 'Essay' ? '✍️ Essay Questions' :
                       questionType === 'True/False' ? '✅ True/False Questions' : '🔀 Mixed Questions'}
                    </h4>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      <span style={{ 
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        Avg: {stats.averageScore || 0}%
                      </span>
                      <span style={{ 
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        Top: {stats.topScore || 0}%
                      </span>
                      <span style={{ 
                        backgroundColor: '#6b7280',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {stats.totalLearners || 0} learners
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600', fontSize: '12px' }}>Rank</th>
                          <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600', fontSize: '12px' }}>Learner</th>
                          <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600', fontSize: '12px' }}>Exam</th>
                          <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600', fontSize: '12px' }}>Score</th>
                          <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600', fontSize: '12px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr key={result.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 && <Trophy size={14} style={{ color: '#fbbf24', marginRight: '6px' }} />}
                                {index === 1 && <Trophy size={14} style={{ color: '#9ca3af', marginRight: '6px' }} />}
                                {index === 2 && <Trophy size={14} style={{ color: '#cd7c2f', marginRight: '6px' }} />}
                                <span style={{ fontWeight: index < 3 ? '600' : '400', fontSize: '12px' }}>
                                  #{index + 1}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '8px', fontWeight: '500', fontSize: '12px' }}>
                              {result.studentName}
                            </td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>
                              {result.examTitle}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <span style={{ 
                                color: result.percentage >= 80 ? '#10b981' : 
                                       result.percentage >= 60 ? '#f59e0b' : '#ef4444',
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                {result.percentage}%
                              </span>
                            </td>
                            <td style={{ padding: '8px', color: '#6b7280', fontSize: '11px' }}>
                              {new Date(result.submittedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default BatchPerformance;