import React from 'react';
import { useQuery } from 'react-query';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { StatCard, Card, LoadingSpinner } from '../../components/common';
import api from '../../utils/api';

const AdminDashboard = () => {
  const { data: analytics, isLoading } = useQuery('analytics', async () => {
    const response = await api.get('/api/analytics');
    return response.data.data || {};
  });

  const { data: exams } = useQuery('admin-exams', async () => {
    const response = await api.get('/api/exams');
    return response.data.data || [];
  });

  const { data: results } = useQuery('all-results', async () => {
    const response = await api.get('/api/results/all');
    return response.data.data || [];
  });

  const stats = {
    totalStudents: analytics?.totalStudents || 0,
    totalExams: exams?.length || 0,
    totalSubmissions: results?.length || 0,
    averageScore: results?.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0
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
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;