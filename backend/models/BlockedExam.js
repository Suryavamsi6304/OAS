const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlockedExam = sequelize.define('BlockedExam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Exams',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('blocked', 'approved', 'terminated'),
    defaultValue: 'blocked'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'blocked_exams',
  timestamps: true
});

module.exports = BlockedExam;