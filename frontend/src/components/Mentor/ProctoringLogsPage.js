import React from 'react';
import DashboardLayout from '../Layout/DashboardLayout';
import ProctoringLogs from './ProctoringLogs';

const ProctoringLogsPage = () => {
  return (
    <DashboardLayout title="Proctoring Logs">
      <ProctoringLogs />
    </DashboardLayout>
  );
};

export default ProctoringLogsPage;