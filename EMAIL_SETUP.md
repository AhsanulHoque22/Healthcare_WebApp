# Email Configuration Setup for Password Reset

This guide explains how to configure email functionality for the forgot password feature in the healthcare application.

## Current Issue

The forgot password functionality is implemented but emails are not being sent because the SMTP configuration is not properly set up.

## Quick Fix

### 1. Update Environment Variables

The `.env` file has been updated with the correct variable names. Make sure your `server/.env` file contains:

```env
# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@healthcare.com
```

### 2. Gmail Setup (Recommended)

To use Gmail for sending emails:

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Enable 2-factor authentication if not already enabled

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Generate a 16-character app password
   - Use this password in the `SMTP_PASS` field

3. **Update .env file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youremail@gmail.com
   SMTP_PASS=your-16-character-app-password
   FROM_EMAIL=youremail@gmail.com
   ```

### 3. Alternative Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
FROM_EMAIL=noreply@yourdomain.com
```

## Database Migration Fix

The database migration has been fixed to use the correct column names. If you've already run the migration with the old names, you may need to:

1. **Check current database structure:**
   ```sql
   DESCRIBE users;
   ```

2. **If columns exist with snake_case names, rename them:**
   ```sql
   ALTER TABLE users CHANGE reset_password_token resetPasswordToken VARCHAR(255);
   ALTER TABLE users CHANGE reset_password_expires resetPasswordExpires DATETIME;
   ```

3. **Or drop and recreate the migration:**
   ```bash
   # In server directory
   npx sequelize-cli db:migrate:undo --name 20251002114654-add-password-reset-fields.js
   npx sequelize-cli db:migrate
   ```

## Testing the Functionality

1. **Start the server** with proper email configuration
2. **Go to forgot password page**: http://localhost:3000/forgot-password
3. **Enter a valid email** from your users table
4. **Check email inbox** for the reset link
5. **Click the reset link** to set a new password

## Troubleshooting

### Email Not Sending
- Check server console for email errors
- Verify SMTP credentials are correct
- Ensure Gmail app password is used (not regular password)
- Check spam/junk folder

### Reset Link Not Working
- Verify the `CLIENT_URL` in .env matches your frontend URL
- Check that the token hasn't expired (10 minutes)
- Ensure database columns are correctly named

### Database Errors
- Run migrations: `npx sequelize-cli db:migrate`
- Check database connection
- Verify column names match the model

## Security Notes

- Reset tokens expire after 10 minutes
- Tokens are cryptographically secure (32 random bytes)
- Passwords are hashed before storage
- Email credentials should never be committed to version control

## Production Considerations

- Use a dedicated email service (SendGrid, Mailgun, etc.)
- Set up proper DNS records for email authentication
- Use environment-specific configuration
- Monitor email delivery rates
- Implement rate limiting for password reset requests
