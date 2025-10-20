#!/usr/bin/env node

/**
 * Gmail Configuration Test Script
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmailSetup() {
  console.log('🔧 Testing Gmail SMTP configuration...\n');
  
  // Check if Gmail credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Gmail credentials not configured');
    console.log('Please set SMTP_USER and SMTP_PASS in .env file');
    return;
  }
  
  if (process.env.SMTP_PASS === 'your-gmail-app-password-here') {
    console.log('❌ Gmail App Password not set');
    console.log('Please replace "your-gmail-app-password-here" with your actual Gmail App Password');
    console.log('\n📝 Steps to get Gmail App Password:');
    console.log('1. Go to: https://myaccount.google.com/apppasswords');
    console.log('2. Select "Mail" as the app');
    console.log('3. Copy the 16-character password');
    console.log('4. Update SMTP_PASS in .env file');
    return;
  }
  
  console.log('📧 Gmail Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Pass: ${'*'.repeat(process.env.SMTP_PASS.length)}`);
  console.log('');
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    console.log('⏳ Verifying Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified successfully!');
    
    console.log('⏳ Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '🏥 Healthcare App - Gmail Test Email',
      html: `
        <h2>🎉 Gmail Configuration Successful!</h2>
        <p>Hello!</p>
        <p>This email confirms that your Gmail SMTP configuration is working correctly.</p>
        <p><strong>Your forgot password functionality will now send emails to real Gmail addresses!</strong></p>
        <p>Test the forgot password feature at: <a href="http://localhost:3000/forgot-password">http://localhost:3000/forgot-password</a></p>
        <p>Best regards,<br>Healthcare Team</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Check your Gmail inbox: ${process.env.SMTP_USER}`);
    console.log('');
    console.log('🎉 Gmail configuration is working! Your forgot password emails will now be delivered to real Gmail addresses.');
    
  } catch (error) {
    console.error('❌ Gmail test failed:', error.message);
    console.log('');
    console.log('🔍 Common issues:');
    console.log('- Make sure you\'re using an App Password, not your regular Gmail password');
    console.log('- Ensure 2-factor authentication is enabled on your Gmail account');
    console.log('- Check that the App Password is correct (16 characters)');
    console.log('- Verify your Gmail account allows "Less secure app access" (if needed)');
  }
}

testGmailSetup();
