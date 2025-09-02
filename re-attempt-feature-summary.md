# Re-attempt Request Feature Implementation

## 🎯 Feature Overview
Students who fail exams can now request re-attempts from teachers, with a complete notification system for both parties.

## 📋 Implementation Details

### Backend Components

#### 1. Database Models
- **ReAttemptRequest** (`/backend/models/ReAttemptRequest.js`)
  - Tracks student re-attempt requests
  - Links to student, exam, and original result
  - Stores reason, status, and review comments

- **Notification** (`/backend/models/Notification.js`)
  - Manages notifications for teachers and learners
  - Supports different notification types
  - Tracks read/unread status

#### 2. Controllers
- **reAttemptController.js** - Handles request creation and review
- **notificationController.js** - Manages notification operations

#### 3. API Endpoints
```
POST   /api/re-attempt/request              - Student requests re-attempt
GET    /api/re-attempt/requests             - Teacher views all requests
PUT    /api/re-attempt/requests/:id/review  - Teacher approves/rejects

GET    /api/notifications                   - Get user notifications
PUT    /api/notifications/:id/read          - Mark notification as read
GET    /api/notifications/unread-count      - Get unread count
```

### Frontend Components

#### 1. Student Features
- **Results.js** - Updated with "Request Re-attempt" button for failed exams
- **Re-attempt Modal** - Form to submit re-attempt request with reason

#### 2. Teacher Features
- **ReAttemptRequests.js** - Complete management interface for reviewing requests
- **NotificationBell.js** - Real-time notification dropdown
- **Enhanced Mentor Dashboard** - Integrated re-attempt requests tab

## 🔄 User Flow

### Student Flow
1. **Take Exam** → Fail (score < passing score)
2. **View Results** → See "Request Re-attempt" button
3. **Click Button** → Fill reason in modal
4. **Submit Request** → Notification sent to teacher
5. **Wait for Response** → Receive approval/rejection notification

### Teacher Flow
1. **Receive Notification** → Student failed and requesting re-attempt
2. **Open Requests Tab** → View all pending requests
3. **Review Request** → See student details, score, and reason
4. **Make Decision** → Approve or reject with optional comment
5. **Submit Review** → Notification sent to student

## 🎨 UI Features

### Student Interface
- **Failed Exam Badge** - Clear visual indicator
- **Re-attempt Button** - Only shown for failed exams (not practice tests)
- **Request Modal** - Clean form with reason textarea
- **Status Feedback** - Toast notifications for success/error

### Teacher Interface
- **Notification Bell** - Shows unread count with red badge
- **Request Cards** - Clean layout showing student info, exam, score
- **Review Modal** - Approve/reject buttons with comment field
- **Status Badges** - Visual indicators for pending/approved/rejected

## 🔧 Technical Features

### Security
- **Role-based Access** - Only learners can request, only mentors/admins can review
- **Data Validation** - Required reason field, proper status validation
- **Authentication** - All endpoints protected with JWT middleware

### Database
- **Proper Associations** - Foreign keys linking users, exams, results
- **Status Tracking** - Enum fields for request and notification status
- **Timestamps** - Automatic tracking of creation and review times

### Real-time Updates
- **Notification Polling** - Checks for new notifications every 30 seconds
- **Auto-refresh** - Lists update after actions
- **Instant Feedback** - Toast notifications for all actions

## 🚀 Usage Instructions

### For Students
1. Take an exam and receive a failing grade
2. Go to "Results" page
3. Find the failed exam and click "Request Re-attempt"
4. Provide a detailed reason for the request
5. Submit and wait for teacher response
6. Check notifications for approval/rejection

### For Teachers
1. Receive notification when student requests re-attempt
2. Click notification bell to see details
3. Go to "Re-attempt Requests" tab in dashboard
4. Review student information and reason
5. Approve or reject with optional comment
6. Student receives notification of decision

## 📊 Business Rules

### Re-attempt Eligibility
- ✅ Student must have failed (score < passing score)
- ✅ Only for exams and skill assessments (not practice tests)
- ✅ Cannot request if already pending
- ✅ Cannot request for passed exams

### Notification Types
- `re_attempt_request` - Sent to teacher when student requests
- `re_attempt_approved` - Sent to student when approved
- `re_attempt_rejected` - Sent to student when rejected

## 🧪 Testing

Run the test script to verify functionality:
```bash
node test-re-attempt.js
```

This tests the complete flow from student request to teacher approval and notifications.

## 🎉 Benefits

### For Students
- **Second Chances** - Opportunity to improve failing grades
- **Transparent Process** - Clear request and approval workflow
- **Real-time Updates** - Instant notifications on request status

### For Teachers
- **Centralized Management** - All requests in one place
- **Detailed Context** - See student performance and reasoning
- **Flexible Decisions** - Approve/reject with custom comments

### For Institution
- **Better Outcomes** - Students can recover from technical issues
- **Audit Trail** - Complete record of all re-attempt requests
- **Fair Process** - Standardized workflow for all students