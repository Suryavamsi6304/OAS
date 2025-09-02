import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, BookOpen, Award, TrendingUp, Eye, CheckCircle, XCircle, Clock, Plus, Code, Target, Edit, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReAttemptRequests from './ReAttemptRequests';
import NotificationBell from '../Notifications/NotificationBell';

const EnhancedMentorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [skillAssessments, setSkillAssessments] = useState([]);
  const [reAttemptRequests, setReAttemptRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreatePractice, setShowCreatePractice] = useState(false);
  const [showCreateSkill, setShowCreateSkill] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const resultsRes = await axios.get('/api/results/all');
      setResults(resultsRes.data.data || []);
      
      const requestsRes = await axios.get('/api/re-attempt/requests');
      setReAttemptRequests(requestsRes.data.data || []);
      
      const practiceRes = await axios.get('/api/practice-tests');
      const allPracticeTests = practiceRes.data.data || [];
      setPracticeTests(allPracticeTests.filter(test => test.createdBy === user.id));
      
      const skillRes = await axios.get('/api/skills/assessment');
      const allSkillAssessments = skillRes.data.data || [];
      setSkillAssessments(allSkillAssessments.filter(assessment => assessment.createdBy === user.id));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const needsGrading = results.filter(result => 
    result.answers?.some(answer => answer.needsReview)
  ) || [];

  const stats = {
    totalStudents: new Set(results.map(r => r.studentId)).size,
    totalSubmissions: results.length,
    needsGrading: needsGrading.length,
    pendingRequests: reAttemptRequests.filter(r => r.status === 'pending').length,
    practiceTestsCreated: practiceTests.length,
    skillAssessmentsCreated: skillAssessments.length
  };

  const handleCreatePracticeTest = (formData) => {
    const newTest = {
      id: Date.now(),
      title: formData.title,
      difficulty: formData.difficulty,
      questions: parseInt(formData.questions),
      timeLimit: parseInt(formData.timeLimit),
      createdBy: user.username,
      attempts: 0
    };
    setPracticeTests([...practiceTests, newTest]);
    setShowCreatePractice(false);
    toast.success('Practice test created successfully!');
  };

  const handleCreateSkillAssessment = (formData) => {
    const newAssessment = {
      id: Date.now(),
      skill: formData.skill,
      level: formData.level,
      questions: parseInt(formData.questions),
      timeLimit: parseInt(formData.timeLimit),
      createdBy: user.username,
      attempts: 0
    };
    setSkillAssessments([...skillAssessments, newAssessment]);
    setShowCreateSkill(false);
    toast.success('Skill assessment created successfully!');
  };

  const deletePracticeTest = (id) => {
    setPracticeTests(practiceTests.filter(test => test.id !== id));
    toast.success('Practice test deleted');
  };

  const deleteSkillAssessment = (id) => {
    setSkillAssessments(skillAssessments.filter(assessment => assessment.id !== id));
    toast.success('Skill assessment deleted');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  const CreatePracticeTestForm = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90vw' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Create Practice Test</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleCreatePracticeTest(Object.fromEntries(formData));
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Title</label>
            <input name="title" required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Difficulty</label>
            <select name="difficulty" required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Questions</label>
              <input name="questions" type="number" required min="1" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Time Limit (min)</label>
              <input name="timeLimit" type="number" required min="1" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowCreatePractice(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );

  const CreateSkillAssessmentForm = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90vw' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Create Skill Assessment</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleCreateSkillAssessment(Object.fromEntries(formData));
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Skill/Technology</label>
            <input name="skill" required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Level</label>
            <select name="level" required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Questions</label>
              <input name="questions" type="number" required min="1" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Time Limit (min)</label>
              <input name="timeLimit" type="number" required min="1" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowCreateSkill(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Users size={28} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.totalStudents}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Active Students</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <BookOpen size={28} style={{ color: '#10b981', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.totalSubmissions}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Total Submissions</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <Clock size={28} style={{ color: '#f59e0b', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.needsGrading}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Needs Grading</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <RefreshCw size={28} style={{ color: '#f59e0b', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{stats.pendingRequests}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Pending Requests</p>
        </div>
      </div>

      {/* Recent Submissions */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Recent Submissions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Student</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Exam</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Score</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 5).map((result) => (
                <tr key={result.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>{result.student?.name}</td>
                  <td style={{ padding: '12px' }}>{result.exam?.title}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: result.percentage >= 70 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      {result.percentage}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    {new Date(result.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {result.answers?.some(a => a.needsReview) ? (
                      <span style={{ color: '#f59e0b', fontSize: '12px' }}>Needs Review</span>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '12px' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPracticeTests = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Practice Tests Management</h2>
        <button
          onClick={() => navigate('/mentor/create-practice')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <Plus size={16} />
          Create Practice Test
        </button>
      </div>
      
      {practiceTests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No practice tests created yet. Create your first practice test!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {practiceTests.map((test) => {
            const attempts = results.filter(r => r.examId === test.id).length;
            
            return (
              <div key={test.id} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{test.title}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '4px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => deletePracticeTest(test.id)} style={{ padding: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    Practice
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
                  <span>❓ {test.questions?.length || 0} questions</span>
                  <span>⏱️ {test.duration}min</span>
                  <span>👥 {attempts} attempts</span>
                </div>
                
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Created: {new Date(test.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSkillAssessments = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Skill Assessments Management</h2>
        <button
          onClick={() => navigate('/mentor/create-skill')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <Plus size={16} />
          Create Skill Assessment
        </button>
      </div>
      
      {skillAssessments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <Code size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No skill assessments created yet. Create your first skill assessment!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {skillAssessments.map((assessment) => {
            const attempts = results.filter(r => r.examId === assessment.id).length;
            
            return (
              <div key={assessment.id} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code size={20} style={{ color: '#10b981' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{assessment.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '4px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => deleteSkillAssessment(assessment.id)} style={{ padding: '4px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1'
                  }}>
                    Skill Assessment
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
                  <span>❓ {assessment.questions?.length || 0} questions</span>
                  <span>⏱️ {assessment.duration}min</span>
                  <span>👥 {attempts} attempts</span>
                </div>
                
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Created: {new Date(assessment.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>Mentor Dashboard</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Manage assessments and student progress</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell />
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
              { id: 'practice', label: 'Practice Tests', icon: Target },
              { id: 'skills', label: 'Skill Assessments', icon: Code },
              { id: 'requests', label: 'Re-attempt Requests', icon: RefreshCw }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 0',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'practice' && renderPracticeTests()}
        {activeTab === 'skills' && renderSkillAssessments()}
        {activeTab === 'requests' && <ReAttemptRequests />}
      </div>

      {/* Modals */}
      {showCreatePractice && <CreatePracticeTestForm />}
      {showCreateSkill && <CreateSkillAssessmentForm />}
    </div>
  );
};

export default EnhancedMentorDashboard;