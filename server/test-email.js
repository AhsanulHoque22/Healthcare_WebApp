require('dotenv').config();
const { sendEmail } = require('./services/emailService');

const testEmail = async () => {
    const args = process.argv.slice(2);
    const recipient = args[0] || process.env.SMTP_USER || 'test@example.com';

    console.log('--- Email Connection Test ---');
    console.log(`Target Recipient: ${recipient}`);
    console.log('Environment Variables Check:');
    console.log(`- BREVO_API_KEY: ${process.env.BREVO_API_KEY ? 'Set (starts with ' + process.env.BREVO_API_KEY.substring(0, 10) + '...)' : 'Not set'}`);
    console.log(`- SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'Set (starts with ' + process.env.SENDGRID_API_KEY.substring(0, 10) + '...)' : 'Not set'}`);
    console.log(`- FROM_EMAIL: ${process.env.FROM_EMAIL || 'Not set (defaulting to noreply@livora.com)'}`);
    console.log(`- SMTP_HOST: ${process.env.SMTP_HOST || 'Not set (defaulting to smtp.gmail.com)'}`);
    console.log(`- SMTP_USER: ${process.env.SMTP_USER || 'Not set'}`);
    console.log('');

    try {
        const result = await sendEmail({
            to: recipient,
            subject: 'Livora Email Test Service',
            html: `
                <h1>Livora Email Verification</h1>
                <p>This is a test email from your Healthcare App (Livora).</p>
                <p>If you are seeing this, your email configuration is working correctly!</p>
                <hr />
                <p>Provider Used: ${process.env.BREVO_API_KEY ? 'Brevo Web API' : (process.env.SENDGRID_API_KEY ? 'SendGrid Web API' : 'Nodemailer/SMTP')}</p>
                <p>Timestamp: ${new Date().toLocaleString()}</p>
            `,
            text: 'This is a test email from Livora Healthcare.'
        });

        if (result.success) {
            console.log('\nSUCCESS! The email request was accepted by the provider.');
            console.log(`Provider: ${result.provider}`);
            if (result.messageId) console.log(`Message ID: ${result.messageId}`);
        } else {
            console.log('\nFAILED: No provider could be used. Check your environment variables.');
        }
    } catch (error) {
        console.error('\nCRITICAL ERROR: Failed to send test email.');
        // The detailed error is already logged by the email service, but let's add more if needed
        if (!error.response) {
            console.error(error);
        }
    }
};

testEmail();
