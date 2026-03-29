const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Set API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Create a Nodemailer transporter for SMTP fallback
 */
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000
  });
};

/**
 * Send email via SendGrid (Web API) or Nodemailer (SMTP)
 * @param {Object} options - to, subject, html, text
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.FROM_EMAIL || 'noreply@livora.com';
  
  // Prefer SendGrid Web API (works on all cloud platforms, bypasses port blocks)
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`🚀 Sending email to ${to} via SendGrid Web API...`);
      const msg = {
        to,
        from,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Basic fallback if text not provided
      };
      await sgMail.send(msg);
      console.log(`✅ Email sent via SendGrid to ${to}`);
      return { success: true, provider: 'sendgrid' };
    } catch (err) {
      console.error('❌ SendGrid delivery failed:', err.message);
      if (err.response) console.error(JSON.stringify(err.response.body, null, 2));
      
      // Fallback to SMTP if configured
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return await sendViaNodemailer({ to, from, subject, html, text });
      }
      throw err;
    }
  }

  // Use Nodemailer/SMTP if SendGrid is not configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return await sendViaNodemailer({ to, from, subject, html, text });
  }

  console.warn('⚠️ No email provider (SendGrid or SMTP) configured');
  return { success: false, error: 'No provider' };
};

/**
 * Helper to send via Nodemailer
 */
const sendViaNodemailer = async ({ to, from, subject, html, text }) => {
  try {
    console.log(`📧 Sending email to ${to} via Nodemailer (SMTP)...`);
    const transporter = createTransporter();
    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via Nodemailer to ${to}:`, info.messageId);
    return { success: true, provider: 'nodemailer', messageId: info.messageId };
  } catch (err) {
    console.error('❌ Nodemailer delivery failed:', err.message);
    throw err;
  }
};

module.exports = {
  sendEmail
};
