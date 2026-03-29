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
 * Send email via Brevo, SendGrid, or Nodemailer (SMTP)
 * @param {Object} options - to, subject, html, text
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // Use FROM_EMAIL from env, or a descriptive default. 
  // IMPORTANT: For both Brevo and SendGrid, this MUST be a verified sender/domain in your dashboard.
  const fromEmail = process.env.FROM_EMAIL || 'noreply@livora.com';
  const fromName = process.env.FROM_NAME || 'Livora Healthcare';
  
  const from = {
    email: fromEmail,
    name: fromName
  };

  console.log(`[EmailService] Preparing to send email to: ${to} from: ${fromEmail}`);
  
  // 1. Prefer Brevo (Setup requested by user)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`🚀 Sending email to ${to} via Brevo Web API...`);
      const axios = require('axios');
      
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: from,
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]*>/g, '').trim()
      }, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Email sent via Brevo to ${to}. Message ID: ${response.data.messageId || 'sent'}`);
      return { success: true, provider: 'brevo' };
    } catch (err) {
      console.error('❌ Brevo delivery failed:', err.message);
      if (err.response && err.response.data) {
        console.error('Brevo Error Body:', JSON.stringify(err.response.data, null, 2));
      }
      
      // Fallback to next provider if configured
      if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_USER) throw err;
    }
  }

  // 2. Fallback to SendGrid Web API
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`🚀 Sending email to ${to} via SendGrid Web API...`);
      const msg = {
        to,
        from: from,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '').trim()
      };
      
      const response = await sgMail.send(msg);
      console.log(`✅ Email sent via SendGrid to ${to}. Status: ${response[0].statusCode}`);
      return { success: true, provider: 'sendgrid' };
    } catch (err) {
      console.error('❌ SendGrid delivery failed:', err.message);
      if (err.response) {
        console.error('SendGrid Error Body:', JSON.stringify(err.response.body, null, 2));
      }
      
      // Fallback to next provider if configured
      if (!process.env.SMTP_USER) throw err;
    }
  }

  // 3. Fallback to Nodemailer/SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('🔄 Attempting fallback to SMTP...');
    return await sendViaNodemailer({ to, from: fromEmail, subject, html, text });
  }

  console.warn('⚠️ No email provider (Brevo, SendGrid or SMTP) configured.');
  return { success: false, error: 'No provider configured' };
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
