const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReAttemptRequest = sequelize.define('ReAttemptRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Exams',
      key: 'id'
    }
  },
  resultId: {
    type: DataTypes.INTEGER,
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
    type: DataTypes.INTEGER,
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