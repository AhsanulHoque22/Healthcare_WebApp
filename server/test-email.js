#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * 
 * This script tests the email configuration for the healthcare application.
 * Run this script to verify that your SMTP settings are working correctly.
 * 
 * Usage: node test-email.js [recipient-email]
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Get recipient email from command line argument or use default
const recipientEmail = process.argv[2] || process.env.SMTP_USER;

if (!recipientEmail) {
  console.error('❌ Error: No recipient email provided');
  console.log('Usage: node test-email.js recipient@example.com');
  process.exit(1);
}

// Check if SMTP configuration is available
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ Error: SMTP configuration missing');
  console.log('Please configure the following environment variables in .env:');
  console.log('- SMTP_USER');
  console.log('- SMTP_PASS');
  console.log('- SMTP_HOST (optional, defaults to smtp.gmail.com)');
  console.log('- SMTP_PORT (optional, defaults to 587)');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Test email content
const testMessage = `
  <h2>🏥 Healthcare App - Email Test</h2>
  <p>Hello!</p>
  <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
  <p><strong>Configuration Details:</strong></p>
  <ul>
    <li>SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}</li>
    <li>SMTP Port: ${process.env.SMTP_PORT || 587}</li>
    <li>From Email: ${process.env.FROM_EMAIL || 'noreply@healthcare.com'}</li>
  </ul>
  <p>If you received this email, your password reset functionality should work correctly!</p>
  <p>Best regards,<br>Healthcare Team</p>
`;

async function testEmail() {
  try {
    console.log('🔧 Testing SMTP configuration...');
    console.log(`📧 Sending test email to: ${recipientEmail}`);
    
    // Verify transporter configuration
    console.log('⏳ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
    
    // Send test email
    console.log('⏳ Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@healthcare.com',
      to: recipientEmail,
      subject: '🏥 Healthcare App - Email Configuration Test',
      html: testMessage
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Email sent to: ${recipientEmail}`);
    console.log('');
    console.log('🎉 Your email configuration is working correctly!');
    console.log('The forgot password functionality should now work properly.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('');
    console.log('🔍 Troubleshooting tips:');
    
    if (error.code === 'EAUTH') {
      console.log('- Check your email credentials (SMTP_USER and SMTP_PASS)');
      console.log('- For Gmail, make sure you\'re using an App Password, not your regular password');
      console.log('- Enable 2-factor authentication and generate an App Password');
    } else if (error.code === 'ECONNECTION') {
      console.log('- Check your internet connection');
      console.log('- Verify SMTP_HOST and SMTP_PORT settings');
      console.log('- Check if your firewall is blocking the connection');
    } else {
      console.log('- Double-check all SMTP configuration values');
      console.log('- Try using a different email provider');
    }
    
    console.log('');
    console.log('📖 For detailed setup instructions, see EMAIL_SETUP.md');
    process.exit(1);
  }
}

// Run the test
testEmail();
