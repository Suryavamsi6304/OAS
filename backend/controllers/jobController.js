const { JobPosting, Application, User } = require('../models');

/**
 * Create job posting (Admin only)
 */
const createJob = async (req, res) => {
  try {
    const job = await JobPosting.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all jobs
 */
const getJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.findAll({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Apply for job (Employee only)
 */
const applyForJob = async (req, res) => {
  try {
    const { jobId, documents } = req.body;
    
    // Check if already applied
    const existingApplication = await Application.findOne({
      where: {
        candidateId: req.user.id,
        jobId: jobId
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Already applied for this job'
      });
    }

    const application = await Application.create({
      candidateId: req.user.id,
      jobId: jobId,
      documents: documents || []
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get applications (Role-based access)
 */
const getApplications = async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.user.role === 'employee') {
      whereClause.candidateId = req.user.id;
    } else if (req.user.role === 'mentor') {
      whereClause.mentorId = req.user.id;
    }
    // Admin can see all applications

    const applications = await Application.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['name', 'email']
        },
        {
          model: JobPosting,
          as: 'job',
          attributes: ['title', 'department']
        },
        {
          model: User,
          as: 'mentor',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update application status (Mentor/Admin only)
 */
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, score, mentorId } = req.body;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.update({
      status,
      feedback,
      score,
      mentorId
    });

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  applyForJob,
  getApplications,
  updateApplication
};