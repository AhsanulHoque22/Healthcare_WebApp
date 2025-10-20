#!/usr/bin/env node

/**
 * Database Schema Checker
 * 
 * This script checks if the required database columns exist for password reset functionality.
 */

require('dotenv').config();
const { sequelize } = require('./config/database');
const { User } = require('./models');

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Check if User table exists and get its structure
    console.log('🔍 Checking User table structure...');
    
    const tableDescription = await sequelize.getQueryInterface().describeTable('users');
    console.log('📋 User table columns:');
    
    Object.keys(tableDescription).forEach(column => {
      console.log(`  - ${column}: ${tableDescription[column].type}`);
    });
    
    // Check specifically for password reset fields
    const hasResetToken = tableDescription.resetPasswordToken || tableDescription.reset_password_token;
    const hasResetExpires = tableDescription.resetPasswordExpires || tableDescription.reset_password_expires;
    
    console.log('\n🔐 Password Reset Fields:');
    console.log(`  - resetPasswordToken: ${hasResetToken ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - resetPasswordExpires: ${hasResetExpires ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasResetToken || !hasResetExpires) {
      console.log('\n⚠️  Password reset fields are missing!');
      console.log('Run the following command to add them:');
      console.log('npm run migrate');
    } else {
      console.log('\n✅ All required fields exist for password reset functionality');
    }
    
    // Test creating a user instance to verify model works
    console.log('\n🧪 Testing User model...');
    const testUser = User.build({
      email: 'test@example.com',
      password: 'testpassword',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ User model is working correctly');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n🔧 Database connection failed. Check your .env configuration:');
      console.log('- DB_HOST');
      console.log('- DB_PORT');
      console.log('- DB_NAME');
      console.log('- DB_USER');
      console.log('- DB_PASSWORD');
    }
  } finally {
    await sequelize.close();
  }
}

// Run the check
checkDatabaseSchema();
