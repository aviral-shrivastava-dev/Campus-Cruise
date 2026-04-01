const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendWelcomeEmail } = require('../services/email.service');
const walletService = require('../services/wallet.service');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, college, phone, role, vehicleInfo } = req.body;

    // Validate required fields
    if (!name || !email || !password || !college || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'All required fields must be provided',
          details: {
            required: ['name', 'email', 'password', 'college', 'phone', 'role']
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate role
    if (!Array.isArray(role) || role.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be a non-empty array',
          timestamp: new Date().toISOString()
        }
      });
    }

    const validRoles = ['driver', 'passenger'];
    const allValid = role.every(r => validRoles.includes(r));
    if (!allValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must contain only "driver" or "passenger"',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'Email already registered',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Prepare user data
    const userData = {
      name,
      email,
      password, // Will be hashed by the model hook
      college,
      phone,
      role
    };

    // Add vehicle info if user is a driver
    if (role.includes('driver') && vehicleInfo) {
      userData.vehicleMake = vehicleInfo.make;
      userData.vehicleModel = vehicleInfo.model;
      userData.vehicleColor = vehicleInfo.color;
      userData.licensePlate = vehicleInfo.licensePlate;
    }

    // Create user
    const user = await User.create(userData);

    // Create wallet for the new user
    try {
      await walletService.getOrCreateWallet(user.id);
    } catch (walletError) {
      console.error('Failed to create wallet for new user:', walletError);
      // Don't fail registration if wallet creation fails
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.role
    });

    // Send welcome email (async, don't wait)
    const emailPromise = sendWelcomeEmail(user.email, user.name);
    if (emailPromise && typeof emailPromise.catch === 'function') {
      emailPromise.catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error.message || 'Failed to register user',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Update login timestamp and online status
    await user.update({
      lastSeen: new Date(),
      isOnline: true
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.role
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        token,
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error.message || 'Failed to login',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  register,
  login
};
