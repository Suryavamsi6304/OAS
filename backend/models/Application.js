const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Application Model for Job Applications
 */
const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'JobPostings',
      key: 'id'
    }
  },
  mentorId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('applied', 'under_review', 'interview_scheduled', 'selected', 'rejected'),
    defaultValue: 'applied'
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  feedback: {
    type: DataTypes.TEXT
  },
  score: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
});

module.exports = Application;