const { ProctoringSession, Exam, User } = require('../models');

/**
 * Start proctoring session
 */
const startSession = async (req, res) => {
  try {
    const { examId, environmentCheck, identityData } = req.body;
    
    const session = await ProctoringSession.create({
      examId,
      candidateId: req.user.id,
      environmentCheck,
      identityVerified: identityData?.verified || false,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start proctoring session'
    });
  }
};

/**
 * Report violation
 */
const reportViolation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, severity, timestamp, details } = req.body;

    const session = await ProctoringSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const violation = {
      id: Date.now(),
      type,
      severity,
      timestamp,
      details
    };

    const updatedViolations = [...session.violations, violation];
    const newRiskScore = calculateRiskScore(updatedViolations);

    await session.update({
      violations: updatedViolations,
      riskScore: newRiskScore,
      status: newRiskScore > 80 ? 'flagged' : session.status
    });

    res.json({
      success: true,
      data: {
        riskScore: newRiskScore,
        status: session.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to report violation'
    });
  }
};

/**
 * Update behavior analysis
 */
const updateBehavior = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const behaviorData = req.body;

    const session = await ProctoringSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.update({
      behaviorAnalysis: {
        ...session.behaviorAnalysis,
        ...behaviorData
      }
    });

    res.json({
      success: true,
      message: 'Behavior data updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update behavior data'
    });
  }
};

/**
 * End proctoring session
 */
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { recordings } = req.body;

    const session = await ProctoringSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.update({
      status: 'completed',
      recordings: recordings || session.recordings
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        riskScore: session.riskScore,
        violations: session.violations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
};

/**
 * Get proctoring sessions (Admin/Mentor)
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await ProctoringSession.findAll({
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['name', 'email']
        },
        {
          model: Exam,
          as: 'exam',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
};

/**
 * Calculate risk score based on violations
 */
const calculateRiskScore = (violations) => {
  let score = 0;
  
  violations.forEach(violation => {
    switch (violation.severity) {
      case 'low':
        score += 10;
        break;
      case 'medium':
        score += 25;
        break;
      case 'high':
        score += 50;
        break;
      case 'critical':
        score += 100;
        break;
    }
  });

  return Math.min(score, 100);
};

module.exports = {
  startSession,
  reportViolation,
  updateBehavior,
  endSession,
  getSessions
};