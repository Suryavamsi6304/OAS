import React from 'react';
import { useQuery } from 'react-query';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import api from '../../utils/api';

const Leaderboard = () => {
  const { data: response, isLoading, error } = useQuery('batch-leaderboard', async () => {
    const res = await api.get('/api/results/my-batch-leaderboard');
    return res.data;
  }, {
    retry: 2,
    refetchOnWindowFocus: false
  });

  const leaderboard = response?.data || [];
  const batchCode = response?.batchCode;
  const totalStudents = response?.totalStudents;
  const message = response?.message;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #e5e7eb', 
          borderTop: '4px solid #3b82f6', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite', 
          margin: '0 auto 16px' 
        }}></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>Error loading leaderboard: {error.message}</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>{message || 'No leaderboard data available for your batch.'}</p>
        {batchCode && <p style={{ fontSize: '14px', marginTop: '8px' }}>Batch: {batchCode}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Trophy size={48} style={{ color: '#fbbf24', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Batch Leaderboard
        </h2>
        <p style={{ color: '#374151', fontSize: '16px', fontWeight: '500' }}>
          Top performers in your batch
          {batchCode && <span style={{ color: '#6b7280', fontSize: '14px', display: 'block' }}>Batch: {batchCode}</span>}
          {totalStudents && <span style={{ color: '#6b7280', fontSize: '14px', display: 'block' }}>{totalStudents} students</span>}
        </p>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600' }}>Rank</th>
                <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600' }}>Student</th>
                <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600' }}>Best Score</th>
                <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600' }}>Exam</th>
                <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((student, index) => (
                <tr 
                  key={student.id || `${student.name}-${student.rank}-${index}`} 
                  style={{ 
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: student.isCurrentUser ? '#f0f9ff' : 'transparent'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {student.rank === 1 && <Trophy size={20} style={{ color: '#fbbf24', marginRight: '8px' }} />}
                      {student.rank === 2 && <Medal size={20} style={{ color: '#9ca3af', marginRight: '8px' }} />}
                      {student.rank === 3 && <Award size={20} style={{ color: '#cd7c2f', marginRight: '8px' }} />}
                      <span style={{ 
                        fontWeight: student.rank <= 3 ? '700' : '500',
                        fontSize: '18px',
                        color: student.rank <= 3 ? '#1f2937' : '#6b7280'
                      }}>
                        #{student.rank}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontWeight: student.isCurrentUser ? '600' : '500',
                      color: student.isCurrentUser ? '#0369a1' : '#1f2937'
                    }}>
                      {student.name}
                      {student.isCurrentUser && (
                        <span style={{ 
                          marginLeft: '8px',
                          padding: '2px 6px',
                          backgroundColor: '#0369a1',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          YOU
                        </span>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      color: student.percentage >= 80 ? '#10b981' : 
                             student.percentage >= 60 ? '#f59e0b' : '#ef4444',
                      fontWeight: '600',
                      fontSize: '18px'
                    }}>
                      {student.percentage}%
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>
                    {student.examTitle}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: student.examType === 'skill-assessment' ? '#dbeafe' : '#f3f4f6',
                      color: student.examType === 'skill-assessment' ? '#1e40af' : '#374151',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {student.examType === 'skill-assessment' ? 'Skill Assessment' : 
                       student.examType === 'practice' ? 'Practice Test' : 'Exam'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;