#!/usr/bin/env node

/**
 * User Database Checker
 * 
 * This script lists all users in the database to help with testing
 */

require('dotenv').config();
const { User } = require('./models');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'],
      order: [['createdAt', 'DESC']]
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Create a user account first to test forgot password functionality');
      return;
    }
    
    console.log(`✅ Found ${users.length} users:`);
    console.log('');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   🟢 Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('💡 Use any of these emails to test the forgot password functionality');
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkUsers();
