# Re-attempt System for Skill Assessments

## Overview
The re-attempt system allows learners to request permission to retake skill assessments after failing them. This system ensures that skill assessments maintain their integrity while providing learners with opportunities to improve.

## System Flow

### 1. Learner Attempts Skill Assessment
- Learner takes a skill assessment
- If they fail (score below passing threshold), they cannot immediately retake it
- Practice tests can be retaken unlimited times without approval

### 2. Re-attempt Request Process

#### When Learner Tries to Retake
When a learner tries to access a skill assessment they've already taken:

1. **Access Blocked**: The system blocks access and shows a modal
2. **Request Modal**: Learner sees a modal with two options:
   - Submit re-attempt request with reason
   - Cancel and leave

#### Request Submission
- Learner must provide a detailed reason for wanting to retake
- System validates that they've actually taken the exam
- Only one re-attempt request allowed per exam
- Request is sent to the mentor who created the exam

### 3. Mentor Review Process

#### Mentor Dashboard
- Mentors see pending re-attempt requests in their dashboard
- "Requests" tab shows all pending requests for their exams
- Real-time notifications when new requests arrive

#### Review Options
- **Approve**: Allows learner to retake the exam once
- **Reject**: Denies the request with optional comment
- Mentors can add comments explaining their decision

### 4. Post-Review Actions

#### If Approved
- Learner receives notification of approval
- Learner can now access and retake the exam
- After retaking, the approval is marked as "used"
- Only one additional attempt is granted per approval

#### If Rejected
- Learner receives notification with mentor's comment
- Learner cannot retake the exam
- No further re-attempt requests allowed for that exam

## Technical Implementation

### Backend Components

#### Controllers
- `reAttemptController.js`: Handles all re-attempt logic
  - `requestReAttempt()`: Creates new re-attempt requests
  - `getReAttemptRequests()`: Gets requests for mentors
  - `reviewReAttemptRequest()`: Approves/rejects requests
  - `getMyReAttemptRequests()`: Gets learner's own requests

#### Routes
- `POST /api/re-attempt/request`: Submit re-attempt request
- `GET /api/re-attempt/requests`: Get requests (mentor only)
- `PUT /api/re-attempt/requests/:id/review`: Review request (mentor only)
- `GET /api/re-attempt/my-requests`: Get own requests (learner only)

#### Database Model
```javascript
ReAttemptRequest {
  id: UUID
  studentId: UUID (foreign key to User)
  examId: UUID (foreign key to Exam)
  resultId: UUID (foreign key to Result)
  reason: TEXT
  status: ENUM('pending', 'approved', 'rejected', 'used')
  reviewedBy: UUID (foreign key to User)
  reviewedAt: TIMESTAMP
  reviewComment: TEXT
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Frontend Components

#### Learner Components
- `SkillAssessments.js`: Shows re-attempt modal when access blocked
- `ReAttempts.js`: Displays learner's re-attempt request history
- `ReAttemptRequest.js`: Standalone form for submitting requests

#### Mentor Components
- `ReAttemptRequests.js`: Main component for reviewing requests
- `EnhancedMentorDashboard.js`: Includes requests tab

### Key Features

#### Security & Validation
- Only skill assessments require re-attempt approval
- Practice tests remain unlimited
- Mentors can only review requests for their own exams
- One re-attempt request per exam per learner
- Approved requests are single-use only

#### User Experience
- Modal-based request submission (no page redirects)
- Real-time notifications via Socket.IO
- Clear status indicators (pending, approved, rejected)
- Detailed request history for learners
- Batch filtering for mentors

#### Exam Access Control
- `examController.js` checks for existing results
- Blocks access if result exists and no approved re-attempt
- Allows access if approved re-attempt exists
- Marks re-attempt as "used" after submission

## Usage Examples

### Learner Flow
1. Take skill assessment → Fail
2. Try to retake → See modal
3. Submit request with reason
4. Wait for mentor approval
5. Receive notification
6. Retake exam (if approved)

### Mentor Flow
1. Receive notification of new request
2. Go to dashboard → Requests tab
3. Review request details
4. Approve/reject with comment
5. Learner receives notification

## Configuration

### Exam Types
- **Practice Tests**: `type: 'practice'` - No restrictions
- **Skill Assessments**: `type: 'skill-assessment'` - Re-attempt approval required

### Status Values
- `pending`: Request submitted, awaiting review
- `approved`: Request approved, learner can retake
- `rejected`: Request denied
- `used`: Approved request has been used for retake

## Testing

Run the test script to verify the complete flow:
```bash
node test-re-attempt-flow.js
```

This tests:
- Initial exam access
- Access blocking after attempt
- Re-attempt request submission
- Mentor approval process
- Post-approval exam access

## Benefits

1. **Maintains Assessment Integrity**: Prevents unlimited retakes of skill assessments
2. **Provides Learning Opportunities**: Allows genuine requests for improvement
3. **Mentor Oversight**: Ensures requests are reviewed by qualified mentors
4. **Transparent Process**: Clear status tracking for all parties
5. **Flexible System**: Different rules for practice vs. skill assessments