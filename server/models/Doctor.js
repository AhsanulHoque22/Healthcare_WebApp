const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  bmdcRegistrationNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    comment: 'BMDC Registration Number - unique identifier for doctors'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  education: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  certifications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  availability: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Enhanced profile fields
  profileImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL or path to doctor profile image'
  },
  degrees: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of degrees and qualifications'
  },
  awards: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of awards and recognitions'
  },
  hospital: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Primary hospital or clinic name'
  },
  location: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: 'Hospital/clinic address'
  },
  chamberTimes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Available chamber times for each day'
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Consultation fee in BDT'
  },
  languages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: ['English', 'Bengali'],
    comment: 'Languages spoken by doctor'
  },
  services: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Medical services offered'
  }
}, {
  tableName: 'doctors'
});

module.exports = Doctor;