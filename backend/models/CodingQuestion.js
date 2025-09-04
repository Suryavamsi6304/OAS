const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CodingQuestion = sequelize.define('CodingQuestion', {
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
    type: DataTypes.TEXT,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    defaultValue: 'Easy'
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 30 // seconds
  },
  memoryLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 256 // MB
  },
  testCases: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  sampleInput: {
    type: DataTypes.TEXT
  },
  sampleOutput: {
    type: DataTypes.TEXT
  },
  constraints: {
    type: DataTypes.TEXT
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'coding_questions',
  timestamps: true
});

module.exports = CodingQuestion;