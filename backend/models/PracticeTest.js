const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PracticeTest = sequelize.define('PracticeTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    defaultValue: 'Easy'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questions: {
    type: DataTypes.JSON,
    allowNull: false
  },
  negativeMarking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  negativeMarkingValue: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'practice'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'practice_tests',
  timestamps: true
});

module.exports = PracticeTest;