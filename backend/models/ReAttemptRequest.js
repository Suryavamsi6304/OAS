const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReAttemptRequest = sequelize.define('ReAttemptRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  examId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Exams',
      key: 'id'
    }
  },
  resultId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Results',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE
  },
  reviewComment: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = ReAttemptRequest;