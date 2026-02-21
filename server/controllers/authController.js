const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User, Patient, Doctor } = require('../models');
const {
  triggerNewUserRegistration,
  triggerWelcomePatient,
  triggerWelcomeDoctor,
  triggerDoctorVerificationRequest,
} = require('../services/notificationTriggers');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
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

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      role: role || 'patient'
    });

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

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

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

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please login to continue.',
      data: {
        user: userResponse
      }
    });
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

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

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

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
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

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Email content
    const message = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.firstName},</p>
      <p>You requested a password reset for your HealthCare account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>HealthCare Team</p>
    `;

    // Send email (only if SMTP is configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = createTransporter();

        // Verify transporter configuration
        await transporter.verify();
        console.log('SMTP server is ready to take our messages');

        const mailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@healthcare.com',
          to: user.email,
          subject: 'Password Reset Request - HealthCare',
          html: message
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully:', info.messageId);

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        console.error('SMTP Configuration:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? '***configured***' : 'not configured',
          pass: process.env.SMTP_PASS ? '***configured***' : 'not configured'
        });
        // Continue without failing the request
      }
    } else {
      console.warn('SMTP not configured - password reset email not sent');
      console.warn('Please configure SMTP_USER and SMTP_PASS in .env file');
    }

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
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
  resetPassword
};
