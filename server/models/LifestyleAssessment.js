const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LifestyleAssessment = sequelize.define('LifestyleAssessment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weekStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    responses: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    completionScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    skippedQuestions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'),
      defaultValue: 'in_progress',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'lifestyle_assessments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['patientId', 'weekStartDate']
      }
    ]
  });

  return LifestyleAssessment;
};
