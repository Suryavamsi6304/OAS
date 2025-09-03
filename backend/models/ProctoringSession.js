const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Proctoring Session Model
 */
const ProctoringSession = sequelize.define('ProctoringSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Exams',
      key: 'id'
    }
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sessionType: {
    type: DataTypes.ENUM('live', 'recorded', 'ai_automated'),
    defaultValue: 'ai_automated'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'flagged', 'terminated'),
    defaultValue: 'active'
  },
  violations: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  recordings: {
    type: DataTypes.JSONB,
    defaultValue: {
      video: null,
      screen: null,
      audio: null
    }
  },
  identityVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  environmentCheck: {
    type: DataTypes.JSONB,
    defaultValue: {
      camera: false,
      microphone: false,
      internet: false,
      browser: false
    }
  },
  behaviorAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      eyeGazeViolations: 0,
      voiceDetections: 0,
      multiplePersons: 0,
      suspiciousMovements: 0,
      tabSwitches: 0
    }
  },
  proctorNotes: {
    type: DataTypes.TEXT
  },
  riskScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = ProctoringSession;