const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Result Model for PostgreSQL
 */
const Result = sequelize.define('Result', {
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
  answers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  timeSpent: {
    type: DataTypes.INTEGER // in minutes
  },
  status: {
    type: DataTypes.ENUM('completed', 'in-progress', 'reviewed', 'passed', 'failed'),
    defaultValue: 'completed'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (result) => {
      if (result.totalPoints > 0) {
        result.percentage = Math.round((result.score / result.totalPoints) * 100);
      }
    }
  }
});

module.exports = Result;