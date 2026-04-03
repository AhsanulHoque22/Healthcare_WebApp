/**
 * Database Schema Fixer
 * 
 * This script adds the missing 'signature' column to the 'doctors' table.
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function fixDatabaseSchema() {
  try {
    console.log('🔍 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    console.log('🔍 Checking doctors table structure...');
    const tableDescription = await sequelize.getQueryInterface().describeTable('doctors');
    
    if (tableDescription.signature) {
      console.log('✅ Column "signature" already exists in "doctors" table');
    } else {
      console.log('➕ Adding "signature" column to "doctors" table...');
      await sequelize.getQueryInterface().addColumn('doctors', 'signature', {
        type: require('sequelize').DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL or path to doctor digital signature'
      });
      console.log('✅ Successfully added "signature" column');
    }
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixDatabaseSchema();
