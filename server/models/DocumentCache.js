const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const DocumentCache = sequelize.define('DocumentCache', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  urlHash: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  extractedData: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'document_cache',
  timestamps: true,
  hooks: {
    beforeValidate: (cache) => {
      if (cache.url && !cache.urlHash) {
        cache.urlHash = crypto.createHash('sha256').update(cache.url).digest('hex');
      }
    }
  }
});

module.exports = DocumentCache;
