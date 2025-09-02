const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Job Posting Model for Recruitment System
 */
const JobPosting = sequelize.define('JobPosting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requirements: {
    type: DataTypes.TEXT
  },
  location: {
    type: DataTypes.STRING
  },
  salary: {
    type: DataTypes.STRING
  },
  department: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'draft'),
    defaultValue: 'active'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  deadline: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = JobPosting;