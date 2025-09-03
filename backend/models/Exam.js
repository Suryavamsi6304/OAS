const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Exam Model for PostgreSQL
 */
const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false // in minutes
  },
  questions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startTime: {
    type: DataTypes.DATE
  },
  endTime: {
    type: DataTypes.DATE
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  type: {
    type: DataTypes.ENUM('exam', 'practice', 'skill-assessment'),
    defaultValue: 'exam'
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  batchCode: {
    type: DataTypes.STRING,
    allowNull: true // Can be assigned to specific batch or all
  },
  proctoringEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (exam) => {
      if (exam.questions && Array.isArray(exam.questions)) {
        exam.totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      }
    }
  }
});

module.exports = Exam;