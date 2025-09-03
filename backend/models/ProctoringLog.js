const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProctoringLog = sequelize.define('ProctoringLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
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
  violationType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  riskScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'flagged', 'terminated'),
    defaultValue: 'active'
  }
}, {
  timestamps: true
});

module.exports = ProctoringLog;