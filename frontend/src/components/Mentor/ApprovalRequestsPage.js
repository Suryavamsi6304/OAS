import React from 'react';
import DashboardLayout from '../Layout/DashboardLayout';
import ProctoringRequests from './ProctoringRequests';

const ApprovalRequestsPage = () => {
  return (
    <DashboardLayout title="Approval Requests">
      <ProctoringRequests />
    </DashboardLayout>
  );
};

export default ApprovalRequestsPage;