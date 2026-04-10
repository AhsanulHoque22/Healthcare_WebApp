const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentCache = sequelize.define('DocumentCache', {
  url: {
    type: DataTypes.STRING(2048),
    primaryKey: true
  },
  extractedData: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'document_cache',
  timestamps: true
});

module.exports = DocumentCache;
