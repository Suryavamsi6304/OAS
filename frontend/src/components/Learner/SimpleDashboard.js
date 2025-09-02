import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SimpleDashboard = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user?.name}!</h1>
      <p>Role: {user?.role}</p>
      <p>This is your learner dashboard.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Available Features:</h2>
        <ul>
          <li>View Job Listings</li>
          <li>Apply for Jobs</li>
          <li>Track Applications</li>
          <li>Take Assessments</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleDashboard;