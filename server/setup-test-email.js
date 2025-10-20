#!/usr/bin/env node

/**
 * Ethereal Email Setup Script
 * 
 * This script creates test email credentials using Ethereal Email
 * and updates your .env file automatically.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function setupTestEmail() {
  try {
    console.log('🔧 Setting up test email credentials...');
    
    // Create test account with Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Test email account created!');
    console.log(`📧 Email: ${testAccount.user}`);
    console.log(`🔑 Password: ${testAccount.pass}`);
    console.log(`🌐 SMTP Host: ${testAccount.smtp.host}`);
    console.log(`🔌 SMTP Port: ${testAccount.smtp.port}`);
    
    // Read current .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update SMTP settings
    envContent = envContent.replace(/SMTP_HOST=.*/, `SMTP_HOST=${testAccount.smtp.host}`);
    envContent = envContent.replace(/SMTP_PORT=.*/, `SMTP_PORT=${testAccount.smtp.port}`);
    envContent = envContent.replace(/SMTP_USER=.*/, `SMTP_USER=${testAccount.user}`);
    envContent = envContent.replace(/SMTP_PASS=.*/, `SMTP_PASS=${testAccount.pass}`);
    envContent = envContent.replace(/FROM_EMAIL=.*/, `FROM_EMAIL=${testAccount.user}`);
    
    // Write updated .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env file updated with test credentials');
    console.log('');
    console.log('🎉 Setup complete! Now you can:');
    console.log('1. Restart your server (Ctrl+C and npm run dev)');
    console.log('2. Test forgot password functionality');
    console.log('3. View sent emails at: https://ethereal.email/');
    console.log('');
    console.log('📝 Login to Ethereal Email with:');
    console.log(`   Email: ${testAccount.user}`);
    console.log(`   Password: ${testAccount.pass}`);
    console.log('');
    console.log('⚠️  Note: These are temporary test credentials for development only!');
    
  } catch (error) {
    console.error('❌ Failed to setup test email:', error.message);
  }
}

setupTestEmail();
