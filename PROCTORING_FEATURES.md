# Enhanced Proctoring Features

## Overview
This document outlines the enhanced proctoring features implemented to address specific requirements:

1. **No automatic submission on fullscreen exit**
2. **Violation tracking with 5-violation limit**
3. **Mentor approval system for blocked exams**

## Features Implemented

### 1. Fullscreen Violation Handling
- **Previous Behavior**: Exam was automatically submitted when student exited fullscreen
- **New Behavior**: 
  - Violation is logged but exam continues
  - Warning message displayed to student
  - System attempts to re-enter fullscreen after 2 seconds
  - No automatic submission

### 2. Violation Tracking System
- **Violation Counter**: Tracks all violations in real-time
- **Violation Types**:
  - Fullscreen exit (High severity)
  - Tab switching (High severity)
  - Copy/paste attempts (High severity)
  - Mouse leaving window (Medium severity)
  - Right-click attempts (Low severity)
  - Suspicious key presses (Medium severity)

### 3. 5-Violation Blocking System
- **Automatic Blocking**: When student reaches 5 violations, exam is automatically blocked
- **Mentor Request**: System automatically sends request to mentor for approval
- **Student Experience**: 
  - Exam window is blocked with explanation
  - Shows violation count and details
  - Displays mentor request status
  - Student cannot continue until mentor responds

### 4. Mentor Approval Dashboard
- **Violation Requests Tab**: New tab in mentor dashboard
- **Request Details**: Shows student info, violation count, risk score, and violation reason
- **Approval Actions**:
  - **Approve**: Student can continue exam with reset violation count
  - **Reject**: Exam is terminated permanently
- **Real-time Updates**: Dashboard polls for new requests every 30 seconds

## Technical Implementation

### Backend Changes
1. **Enhanced Proctoring Controller** (`proctoringController.js`):
   - Added `sendMentorRequest()` function
   - Added `checkMentorResponse()` function  
   - Added `handleMentorRequest()` function
   - Updated `reportViolation()` to check 5-violation limit

2. **Updated Proctoring Routes** (`proctoring.js`):
   - Added `/mentor-request` endpoint
   - Added `/mentor-response/:sessionId` endpoint
   - Added `/mentor-request/:sessionId` endpoint for approval/rejection
   - Updated violation logging to track counts

3. **Database Schema Updates**:
   - Added `mentor_request` JSONB column
   - Added `status` column (active, blocked, completed, terminated)
   - Added `total_violations` counter
   - Added `risk_score` calculation

### Frontend Changes
1. **Enhanced ProctoringMonitor** (`ProctoringMonitor.js`):
   - Real-time violation tracking
   - Automatic blocking at 5 violations
   - Mentor request functionality
   - Blocked screen UI with status updates
   - Violation counter display

2. **Updated ExamTaking** (`ExamTaking.js`):
   - Removed automatic submission on fullscreen exit
   - Added violation reporting integration
   - Added exam blocking UI
   - Enhanced warning messages

3. **New ViolationRequests Component** (`ViolationRequests.js`):
   - Mentor dashboard for handling violation requests
   - Approve/reject functionality
   - Real-time request monitoring
   - Detailed violation information display

## Usage Instructions

### For Students
1. **During Exam**: Violation counter appears after first violation
2. **At 5 Violations**: Exam is blocked with mentor request screen
3. **Waiting Period**: Student sees status updates while waiting for mentor
4. **After Approval**: Exam resumes with reset violation count
5. **After Rejection**: Exam is terminated and student returns to dashboard

### For Mentors
1. **Access**: Go to Mentor Dashboard → "Violation Requests" tab
2. **Review**: See all pending violation requests with details
3. **Decision**: Click "Approve" to allow continuation or "Reject" to terminate
4. **Monitoring**: Dashboard shows real-time updates of new requests

## Database Setup
Run the database update script to add required columns:

```bash
node update-proctoring-db.js
```

## Configuration
The system uses these default settings:
- **Violation Limit**: 5 violations before blocking
- **Poll Interval**: 5 seconds for mentor response checking
- **Fullscreen Retry**: 2 seconds delay before re-entering fullscreen

## Security Features
- All violations are logged with timestamps
- Mentor requests include full violation history
- Risk scores calculated based on violation severity
- Session status prevents tampering with blocked exams

## Benefits
1. **Improved User Experience**: No accidental exam submissions
2. **Fair Assessment**: Students get second chances through mentor approval
3. **Enhanced Security**: Comprehensive violation tracking
4. **Mentor Control**: Full oversight of exam integrity
5. **Audit Trail**: Complete logging of all violations and decisions