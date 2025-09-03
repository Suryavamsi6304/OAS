import React from 'react';
import DashboardLayout from '../Layout/DashboardLayout';
import LiveProctoring from './LiveProctoring';

const LiveMonitorPage = () => {
  return (
    <DashboardLayout title="Live Monitor">
      <LiveProctoring />
    </DashboardLayout>
  );
};

export default LiveMonitorPage;