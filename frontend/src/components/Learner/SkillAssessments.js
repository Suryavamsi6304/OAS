import React, { useState, useEffect } from 'react';
import { Award, Clock, BookOpen, Play, Star, TrendingUp } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';

const SkillAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillAssessments();
  }, []);

  const fetchSkillAssessments = async () => {
    try {
      const response = await axios.get('/api/skill-assessments');
      setAssessments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching skill assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = (assessmentId) => {
    window.location.href = `/learner/assessment/${assessmentId}`;
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[level?.toLowerCase()] || '#6b7280';
  };

  return (
    <DashboardLayout title="Skill Assessments">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Skill Assessments
          </h1>
          <p style={{ color: '#6b7280' }}>
            Test your skills and get certified in various technologies
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p>Loading skill assessments...</p>
          </div>
        ) : assessments.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {assessments.map((assessment) => (
              <div key={assessment.id} className="card" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Award size={20} style={{ color: '#f59e0b', marginRight: '8px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                      {assessment.title}
                    </h3>
                  </div>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    {assessment.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <BookOpen size={16} style={{ marginRight: '8px' }} />
                    {assessment.questionCount || 20} Questions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <Clock size={16} style={{ marginRight: '8px' }} />
                    {assessment.duration || 60} Minutes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <TrendingUp size={16} style={{ marginRight: '8px', color: getSkillLevelColor(assessment.skillLevel) }} />
                    <span style={{ color: getSkillLevelColor(assessment.skillLevel), fontWeight: '500', textTransform: 'capitalize' }}>
                      {assessment.skillLevel || 'Intermediate'}
                    </span>
                  </div>
                  {assessment.passingScore && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <Star size={16} style={{ marginRight: '8px' }} />
                      Passing Score: {assessment.passingScore}%
                    </div>
                  )}
                </div>

                <button
                  onClick={() => startAssessment(assessment.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Play size={16} style={{ marginRight: '8px' }} />
                  Start Assessment
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <Award size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No skill assessments available at the moment.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SkillAssessments;