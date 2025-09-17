import React from 'react';
import DashboardLayout from '../Layout/DashboardLayout';


const ApprovalRequestsPage = () => {
  return (
    <DashboardLayout title="Approval Requests">
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Approval Requests</h2>
        <p>No approval requests at this time.</p>
      </div>
    </DashboardLayout>
  );
};

export default ApprovalRequestsPage;