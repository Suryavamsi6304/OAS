const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SkillAssessment = sequelize.define('SkillAssessment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  skill: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels'),
    defaultValue: 'Beginner'
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
    defaultValue: 60
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
    defaultValue: 'skill-assessment'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'skill_assessments',
  timestamps: true
});

module.exports = SkillAssessment;