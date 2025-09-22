import React from 'react';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { StatCard, Card, LoadingSpinner } from '../../components/common';
import { useExams, useUsers, useApiQuery } from '../../hooks';
import { resultService } from '../../services';

const AdminDashboardRefactored = () => {
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: users, isLoading: usersLoading } = useUsers();
  
  const { data: analytics, isLoading: analyticsLoading } = useApiQuery(
    'analytics',
    () => resultService.getAnalytics()
  );

  const { data: results } = useApiQuery(
    'all-results',
    () => resultService.getAllResults()
  );

  const isLoading = examsLoading || usersLoading || analyticsLoading;

  const stats = {
    totalStudents: analytics?.data?.totalStudents || 0,
    totalExams: exams?.data?.length || 0,
    totalSubmissions: results?.data?.length || 0,
    averageScore: results?.data?.length > 0 ? 
      Math.round(results.data.reduce((sum, r) => sum + r.percentage, 0) / results.data.length) : 0
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <LoadingSpinner fullScreen message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          icon={<BookOpen size={24} />}
          color="green"
        />
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={<Award size={24} />}
          color="yellow"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={<TrendingUp size={24} />}
          color="purple"
        />
      </div>

      <Card>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          System Overview
        </h2>
        <p style={{ color: '#6b7280' }}>
          Welcome to the admin dashboard. Use the navigation to manage users, exams, and view analytics.
        </p>
        
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Recent Activity</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {results?.data?.length || 0} submissions today
            </p>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Active Users</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {users?.data?.filter(u => u.isApproved)?.length || 0} approved users
            </p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboardRefactored;