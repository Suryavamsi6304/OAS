const User = require('./User');
const Exam = require('./Exam');
const Result = require('./Result');
const JobPosting = require('./JobPosting');
const Application = require('./Application');

const ReAttemptRequest = require('./ReAttemptRequest');
const Notification = require('./Notification');
const Batch = require('./Batch');
const Violation = require('./Violation');
const BlockedExam = require('./BlockedExam');
const TerminatedExam = require('./TerminatedExam');
// const CodingQuestion = require('./CodingQuestion');

/**
 * Define model associations for Recruitment System
 */

// User associations
User.hasMany(Exam, { foreignKey: 'createdBy', as: 'createdExams' });
User.hasMany(Result, { foreignKey: 'studentId', as: 'results' });
User.hasMany(JobPosting, { foreignKey: 'createdBy', as: 'createdJobs' });
User.hasMany(Application, { foreignKey: 'candidateId', as: 'applications' });
User.hasMany(Application, { foreignKey: 'mentorId', as: 'mentorApplications' });
User.hasMany(Batch, { foreignKey: 'createdBy', as: 'createdBatches' });

// Batch associations
Batch.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Job Posting associations
JobPosting.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
JobPosting.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });

// Application associations
Application.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });
Application.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
Application.belongsTo(JobPosting, { foreignKey: 'jobId', as: 'job' });



// Exam associations (existing)
Exam.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Exam.hasMany(Result, { foreignKey: 'examId', as: 'results' });

// Result associations (existing)
Result.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Result.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

// ReAttemptRequest associations
ReAttemptRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
ReAttemptRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
ReAttemptRequest.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
ReAttemptRequest.belongsTo(Result, { foreignKey: 'resultId', as: 'result' });
User.hasMany(ReAttemptRequest, { foreignKey: 'studentId', as: 'reAttemptRequests' });
Exam.hasMany(ReAttemptRequest, { foreignKey: 'examId', as: 'reAttemptRequests' });
Result.hasOne(ReAttemptRequest, { foreignKey: 'resultId', as: 'reAttemptRequest' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Violation associations
Violation.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Violation.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
User.hasMany(Violation, { foreignKey: 'studentId', as: 'violations' });
Exam.hasMany(Violation, { foreignKey: 'examId', as: 'violations' });

// BlockedExam associations
BlockedExam.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
BlockedExam.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
BlockedExam.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
User.hasMany(BlockedExam, { foreignKey: 'studentId', as: 'blockedExams' });
Exam.hasMany(BlockedExam, { foreignKey: 'examId', as: 'blockedExams' });

// TerminatedExam associations
TerminatedExam.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
TerminatedExam.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
TerminatedExam.belongsTo(User, { foreignKey: 'terminatedBy', as: 'terminator' });
User.hasMany(TerminatedExam, { foreignKey: 'studentId', as: 'terminatedExams' });
Exam.hasMany(TerminatedExam, { foreignKey: 'examId', as: 'terminatedExams' });



// CodingQuestion associations (temporarily disabled)
// CodingQuestion.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
// User.hasMany(CodingQuestion, { foreignKey: 'createdBy', as: 'codingQuestions' });

module.exports = {
  User,
  Exam,
  Result,
  JobPosting,
  Application,

  ReAttemptRequest,
  Notification,
  Batch,
  Violation,
  BlockedExam,
  TerminatedExam
  // CodingQuestion
};