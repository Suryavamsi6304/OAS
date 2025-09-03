import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/Admin/Dashboard';
import ExamForm from './components/Admin/ExamForm';
import EnhancedMentorDashboard from './components/Mentor/EnhancedMentorDashboard';
import CreatePracticeTest from './components/Mentor/CreatePracticeTest';
import CreateSkillAssessment from './components/Mentor/CreateSkillAssessment';
import ProctoringLogsPage from './components/Mentor/ProctoringLogsPage';
import LiveMonitorPage from './components/Mentor/LiveMonitorPage';
import ApprovalRequestsPage from './components/Mentor/ApprovalRequestsPage';
import ReAttemptRequests from './components/Mentor/ReAttemptRequests';
import EnhancedLearnerDashboard from './components/Learner/EnhancedLearnerDashboard';
import TestInstructions from './components/Learner/TestInstructions';
import SimpleDashboard from './components/Learner/SimpleDashboard';
import TestDashboard from './components/TestDashboard';
import StudentDashboard from './components/Student/Dashboard';
import ExamTaking from './components/Student/ExamTaking';
import Results from './components/Learner/Results';
import ExamResult from './components/Learner/ExamResult';
import Profile from './components/Learner/Profile';
import JobDetails from './components/Learner/JobDetails';
import ApplicationTracker from './components/Learner/ApplicationTracker';
import ReAttempts from './components/Learner/ReAttempts';
import PracticeTests from './components/Learner/PracticeTests';
import SkillAssessments from './components/Learner/SkillAssessments';
import Jobs from './components/Learner/Jobs';

const queryClient = new QueryClient();

/**
 * Protected Route Component with Role-Based Access
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

/**
 * Role-Based Dashboard Router
 */
const DashboardRouter = () => {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'mentor':
      return <Navigate to="/mentor" replace />;
    case 'learner':
      return <Navigate to="/learner" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

/**
 * Main App Component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/dashboard" element={<DashboardRouter />} />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/exams" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ExamForm />
                  </ProtectedRoute>
                } 
              />
              
              {/* Mentor Routes */}
              <Route 
                path="/mentor" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <EnhancedMentorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/create-practice" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <CreatePracticeTest />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/create-skill" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <CreateSkillAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/proctoring-logs" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <ProctoringLogsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/live-monitor" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <LiveMonitorPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/approval-requests" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <ApprovalRequestsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/re-attempts" 
                element={
                  <ProtectedRoute allowedRoles={['mentor']}>
                    <ReAttemptRequests />
                  </ProtectedRoute>
                } 
              />
              
              {/* Learner Routes */}
              <Route 
                path="/learner" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <EnhancedLearnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/exam/:id/instructions" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <TestInstructions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/exam/:id/take" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <ExamTaking />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/results" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <Results />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/results/:examId" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <ExamResult />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/profile" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/job/:id" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <JobDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/applications" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <ApplicationTracker />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/re-attempts" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <ReAttempts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/practice-tests" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <PracticeTests />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/skill-assessments" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <SkillAssessments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learner/jobs" 
                element={
                  <ProtectedRoute allowedRoles={['learner']}>
                    <Jobs />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/unauthorized" element={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Access Denied</h1>
                    <p style={{ color: '#4b5563' }}>You don't have permission to access this page.</p>
                  </div>
                </div>
              } />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;