const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse, generateToken, generateRefreshToken } = require('../utils/generateToken');
const { protect, authorize } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetOTP } = require('../utils/mailer');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth routes (skip for OPTIONS requests)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for preflight
});

// @route   GET /api/auth/me/previews/:productId
// @desc    Get current user's saved preview images for a product
// @access  Private
router.get('/me/previews/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    const map = user.previewImagesByProduct || new Map();
    const previews = map.get(productId) || {};
    res.status(200).json({ success: true, data: previews });
  } catch (error) {
    console.error('Get user previews error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching previews' });
  }
});

// @route   PUT /api/auth/me/previews/:productId
// @desc    Upsert current user's preview images for a product (per view)
// @access  Private
router.put('/me/previews/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { previews } = req.body; // expected shape { [viewKey]: url }

    if (!previews || typeof previews !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid previews payload' });
    }

    const user = await User.findById(req.user.id);
    if (!user.previewImagesByProduct) user.previewImagesByProduct = new Map();

    const existing = user.previewImagesByProduct.get(productId) || {};
    const merged = { ...existing, ...previews };
    user.previewImagesByProduct.set(productId, merged);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, data: merged });
  } catch (error) {
    console.error('Update user previews error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving previews' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 30 })
      .withMessage('Password must be between 8 and 30 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],
  async (req, res) => {
    try {
      // Log incoming request for debugging
      console.log('Register request body:', JSON.stringify(req.body, null, 2));
      console.log('Email type:', typeof req.body.email, 'Value:', req.body.email);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            msg: err.msg,
            param: err.param || err.type,
            value: err.value
          }))
        });
      }

      let { name, email, password, role } = req.body;

      // Clean email - remove any leading @ that normalizeEmail might have added incorrectly
      if (email && typeof email === 'string') {
        email = email.trim();
        // If email starts with @ but doesn't have @ elsewhere, it's likely corrupted
        if (email.startsWith('@') && email.indexOf('@', 1) === -1) {
          email = email.substring(1); // Remove leading @
        }
      }

      // Additional validation
      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required and must be a valid string',
          errors: [{ msg: 'Email is required', param: 'email', value: email }]
        });
      }

      // Validate email format manually as backup
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: [{ msg: 'Please provide a valid email', param: 'email', value: email }]
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Validate role if provided
      const validRoles = ['superadmin', 'merchant', 'staff'];
      const userRole = role && validRoles.includes(role) ? role : 'merchant';

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      console.log('Creating user with:', { name, email, role: userRole });
      const user = await User.create({
        name,
        email,
        password,
        role: userRole,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        verificationTokenExpiry: verificationTokenExpiry
      });
      console.log('User created successfully:', user._id);

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken, name);
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail registration if email fails, but log it
      }

      // Return success response without token (user needs to verify first)
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: false
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      console.error('Error stack:', error.stack);

      // Handle duplicate email error
      if (error.code === 11000 || error.message?.includes('duplicate')) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
          errors: [{ msg: 'Email already registered', param: 'email' }]
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Check for user and include password field
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Check if password matches
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
          requiresVerification: true
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      await sendTokenResponse(user, 200, res);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }
);

// @route   GET /api/auth/verify-email
// @desc    Verify user email with token
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
        error: 'invalid_token'
      });
    }

    // Find user with this token and check expiry
    const user = await User.findOne({
      emailVerificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    }).select('+emailVerificationToken +verificationTokenExpiry');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired',
        error: 'invalid_or_expired_token'
      });
    }

    // Mark as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Return success response
    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: 'verification_failed'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Clear refresh token from database
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   GET /api/auth/users/count
// @desc    Get total user count (Superadmin only)
// @access  Private/Superadmin
router.get('/users/count', protect, authorize('superadmin'), async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({
      success: true,
      count: userCount
    });
  } catch (error) {
    console.error('Get user count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user count'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user and verify refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
});

// @route   PUT /api/auth/updatepassword
// @desc    Update user password
// @access  Private
router.put(
  '/updatepassword',
  protect,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const user = await User.findById(req.user.id).select('+password');

      // Check current password
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.password = req.body.newPassword;
      await user.save();

      await sendTokenResponse(user, 200, res);
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password update'
      });
    }
  }
);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset OTP
// @access  Public
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, a verification code has been sent.'
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in passwordResetToken (reusing existing field)
      user.passwordResetToken = otp;
      user.passwordResetExpires = otpExpiry;
      await user.save({ validateBeforeSave: false });

      // Get device and location info from request
      const device = req.headers['user-agent'] || 'Unknown Browser';
      const location = req.headers['x-forwarded-for'] 
        ? `IP: ${req.headers['x-forwarded-for'].split(',')[0].trim()}`
        : 'Unknown Location';

      // Send OTP email
      try {
        await sendPasswordResetOTP(email, otp, user.name, {
          device: device.substring(0, 100), // Limit length
          location
        });
      } catch (emailError) {
        console.error('Error sending password reset OTP:', emailError);
        // Clear OTP if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification code. Please try again later.'
        });
      }

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password reset request'
      });
    }
  }
);

// @route   POST /api/auth/verify-reset-otp
// @desc    Verify password reset OTP
// @access  Public
router.post(
  '/verify-reset-otp',
  authLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
      .matches(/^\d+$/)
      .withMessage('Verification code must contain only numbers'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp } = req.body;

      // Find user with matching OTP and check expiry
      const user = await User.findOne({
        email,
        passwordResetToken: otp,
        passwordResetExpires: { $gt: Date.now() }
      }).select('+passwordResetToken +passwordResetExpires');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
        });
      }

      // OTP is valid - return success (don't clear it yet, will be cleared on password reset)
      res.status(200).json({
        success: true,
        message: 'Verification code verified successfully'
      });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during OTP verification'
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified OTP
// @access  Public
router.post(
  '/reset-password',
  authLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
      .matches(/^\d+$/)
      .withMessage('Verification code must contain only numbers'),
    body('newPassword')
      .isLength({ min: 8, max: 30 })
      .withMessage('Password must be between 8 and 30 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp, newPassword } = req.body;

      // Find user with matching OTP and check expiry
      const user = await User.findOne({
        email,
        passwordResetToken: otp,
        passwordResetExpires: { $gt: Date.now() }
      }).select('+passwordResetToken +passwordResetExpires +password');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
        });
      }

      // Update password
      user.password = newPassword;
      // Clear reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during password reset'
      });
    }
  }
);

module.exports = router;

