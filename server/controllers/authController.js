const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { User, Patient, Doctor } = require('../models');
const { sendEmail } = require('../services/emailService');
const {
  triggerNewUserRegistration,
  triggerWelcomePatient,
  triggerWelcomeDoctor,
  triggerDoctorVerificationRequest,
  buildEmailHtml,
} = require('../services/notificationTriggers');

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Register user
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, dateOfBirth, gender, address, role, bmdcRegistrationNumber, department, experience } = req.body;
    
    console.log(`[Registration] Attempting to register user: ${email} with role: ${role || 'patient'}`);

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`[Registration] User already exists: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    console.log('[Registration] Creating User record...');
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      role: role || 'patient',
      emailVerified: false
    });
    console.log(`[Registration] User record created with ID: ${user.id}`);

    // Create role-specific profile
    if (user.role === 'patient') {
      await Patient.create({ userId: user.id });
    } else if (user.role === 'doctor') {
      await Doctor.create({ 
        userId: user.id,
        bmdcRegistrationNumber,
        department,
        experience: experience ? parseInt(experience) : null
      });
    }

    // Generate email verification token
    const verifyToken = jwt.sign({ userId: user.id, purpose: 'email-verification' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // Construct frontend URL (similar to forgot password logic)
    let clientUrl = req.headers.origin || req.headers.referer;
    if (clientUrl) {
      clientUrl = clientUrl.replace(/\/$/, '');
    } else {
      const clientUrls = (process.env.CLIENT_URL || 'https://livoracu48.vercel.app').split(',');
      clientUrl = clientUrls.length > 1 ? clientUrls[1].trim() : clientUrls[0].trim();
    }
    const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;
    console.log(`\n======================================================`);
    console.log(`[DEV/QA] 📧 Email Verification Link For New Account:`);
    console.log(`-> ${verifyUrl}`);
    console.log(`======================================================\n`);

    // Send verification email
    sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address - Livora',
      html: buildEmailHtml('Welcome to Livora - Verify Your Email', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${user.firstName},</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Thank you for registering at Livora! Please verify your email address to activate your account and securely log in.</p>
        <div style="margin: 20px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">This link will expire in 24 hours.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }).catch(err => console.error('[authController] Verification email failed:', err.message));

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    console.log('[Registration] Triggering post-registration hooks...');
    triggerNewUserRegistration(userResponse).catch((err) =>
      console.error('[authController] triggerNewUserRegistration:', err.message)
    );
    if (user.role === 'patient') {
      triggerWelcomePatient(userResponse).catch((err) =>
        console.error('[authController] triggerWelcomePatient:', err.message)
      );
    } else if (user.role === 'doctor') {
      triggerWelcomeDoctor(userResponse).catch((err) =>
        console.error('[authController] triggerWelcomeDoctor:', err.message)
      );
      triggerDoctorVerificationRequest().catch((err) =>
        console.error('[authController] triggerDoctorVerificationRequest:', err.message)
      );
    }

    console.log('[Registration] Registration successful, sending response.');
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error(`[Registration] ERROR: ${error.message}`);
    if (error.stack) console.error(error.stack);
    next(error);
  }
};

// Verify Email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is missing' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'email-verification') {
        return res.status(400).json({ success: false, message: 'Invalid token purpose' });
      }

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.emailVerified) {
        return res.status(200).json({ success: true, message: 'Email is already verified' });
      }

      await user.update({ emailVerified: true });

      return res.status(200).json({ success: true, message: 'Email verified successfully' });

    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Determine if login is by email or phone
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user is a legacy account created before April 2, 2026 verification rollout
    const isLegacyUser = new Date(user.createdAt) < new Date('2026-04-03T00:00:00.000Z');

    // Enforce email verification (for logging in with email, blocking only new unverified users)
    if (email && !user.emailVerified && !isLegacyUser) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If a legacy user successfully authenticates with their password, auto-verify their email to migrate them
    if (email && !user.emailVerified && isLegacyUser) {
      user.emailVerified = true;
    }

    // Update last login
    await user.update({ 
      lastLogin: new Date(),
      emailVerified: user.emailVerified
    });

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'patientProfile',
          required: false
        },
        {
          association: 'doctorProfile',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { 
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, dateOfBirth, gender, address } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: newPassword });

    // Security alert email — fire in background
    sendEmail({
      to: user.email,
      subject: 'Password Changed – Livora Security Alert',
      html: buildEmailHtml('Your Password Has Been Changed', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${user.firstName || ''},</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your Livora account password was successfully changed.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf0;border-left:4px solid #dd6b20;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:180px;">Date &amp; Time</td><td style="padding:6px 0;color:#2d3748;">${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Account</td><td style="padding:6px 0;color:#2d3748;">${user.email}</td></tr>
        </table>
        <p style="color:#e53e3e;font-weight:600;margin:0 0 8px;">⚠️ If you did not make this change:</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Contact our support team immediately and use the "Forgot Password" feature to secure your account.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }).catch(err => console.error('[authController] changePassword email failed:', err.message));

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Normalize email first
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.log(`❌ Invalid email format: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }
    console.log(`🔍 Forgot password request for email: ${normalizedEmail}`);

    // Find user by email
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      console.log(`❌ No user found with email: ${normalizedEmail}`);
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address. Please check your email or create a new account.'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log(`⚠️ Inactive user attempted password reset: ${normalizedEmail}`);
      return res.status(403).json({
        success: false,
        message: 'This account is currently inactive. Please contact support for assistance.'
      });
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName} (${user.email})`)

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset token to user
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires
    });

    // Create dynamic reset URL based on where the request came from
    let clientUrl = req.headers.origin || req.headers.referer;
    if (clientUrl) {
      clientUrl = clientUrl.replace(/\/$/, ''); // Remove trailing slash if exists
    } else {
      // Fallback: Use the second URL (LAN IP) if multiple exist, else the first
      const clientUrls = (process.env.CLIENT_URL || 'https://your-netlify-site.netlify.app').split(',');
      clientUrl = clientUrls.length > 1 ? clientUrls[1].trim() : clientUrls[0].trim();
    }
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    // Email content
    const message = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.firstName},</p>
      <p>You requested a password reset for your Livora account.</p>
      <p>Click the link below to reset your password:</p>
      <div style="margin: 20px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Reset Password</a>
      </div>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Livora Team</p>
    `;

    // Send email using optimized centralized service
    // Fired in background to respond immediately to user
    sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Livora',
      html: message
    }).catch(err => {
      console.error('❌ Background forgot-password email failed:', err.message);
    });

    // Always respond success to avoid email enumeration and to respond quickly
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, instructions have been sent.'
    });

  } catch (error) {
    console.error('Forgot password endpoint error:', error.message);
    next(error);
  }
};

// Verify reset token
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid'
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    await user.update({
      password: password, // Will be hashed by the beforeUpdate hook
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    // Confirmation email — fire in background
    sendEmail({
      to: user.email,
      subject: 'Password Reset Successful – Livora',
      html: buildEmailHtml('Password Reset Successful', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${user.firstName || ''},</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your Livora account password has been successfully reset. You can now log in with your new password.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:180px;">Date &amp; Time</td><td style="padding:6px 0;color:#2d3748;">${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Account</td><td style="padding:6px 0;color:#2d3748;">${user.email}</td></tr>
        </table>
        <p style="color:#e53e3e;font-weight:600;margin:0 0 8px;">⚠️ If you did not request this reset:</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Contact our support team immediately as your account may have been compromised.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }).catch(err => console.error('[authController] resetPassword email failed:', err.message));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail
};
