const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TerminatedExam = sequelize.define('TerminatedExam', {
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
  terminatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    defaultValue: 'Terminated by mentor'
  }
}, {
  tableName: 'terminated_exams',
  timestamps: true
});

module.exports = TerminatedExam;