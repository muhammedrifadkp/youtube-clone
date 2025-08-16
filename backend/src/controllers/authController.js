const { validationResult } = require('express-validator');
const User = require('../models/UserMongo');
const UserSession = require('../models/UserSessionMongo');
const {
  AppError,
  asyncHandler,
  sendSuccess,
  formatValidationErrors
} = require('../middleware/errorMiddleware');
const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../middleware/authMiddleware');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *               channelName:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
const register = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(errors)
      }
    });
  }

  const { username, email, password, firstName, lastName, channelName } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const existingUsername = await User.findByUsername(username);
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  // Create user
  const user = await User.createUser({
    username,
    email,
    password,
    firstName,
    lastName,
    channelName
  });

  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store session
  await UserSession.create({
    userId: user.id,
    tokenHash: token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  logger.logAuth('register', user.id, true, {
    username: user.username,
    email: user.email,
    ip: req.ip
  });

  // Remove sensitive data
  const userData = { ...user };
  delete userData.passwordHash;

  sendSuccess(res, 201, {
    user: userData,
    token,
    refreshToken
  }, 'User registered successfully');
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(errors)
      }
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const userData = await User.findByEmail(email);
  if (!userData) {
    logger.logAuth('login', null, false, {
      email,
      reason: 'user_not_found',
      ip: req.ip
    });
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await User.verifyPassword(password, userData.passwordHash);
  if (!isValidPassword) {
    logger.logAuth('login', userData.id, false, {
      email,
      reason: 'invalid_password',
      ip: req.ip
    });
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const token = generateToken(userData.id);
  const refreshToken = generateRefreshToken(userData.id);

  // Store session
  await UserSession.create({
    userId: userData.id,
    tokenHash: token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  logger.logAuth('login', userData.id, true, {
    email: userData.email,
    ip: req.ip
  });

  // Remove sensitive data (handled by toJSON transform in schema)
  const user = userData;

  sendSuccess(res, 200, {
    user,
    token,
    refreshToken
  }, 'Login successful');
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
const logout = asyncHandler(async (req, res) => {
  // Deactivate current session
  await UserSession.updateOne(
    { userId: req.user.id, tokenHash: req.token },
    { isActive: false }
  );

  logger.logAuth('logout', req.user.id, true, {
    ip: req.ip
  });

  sendSuccess(res, 200, null, 'Logout successful');
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Generate new tokens
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Store new session
    await UserSession.create({
      userId: user.id,
      tokenHash: newToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    logger.logAuth('token_refresh', user.id, true, {
      ip: req.ip
    });

    sendSuccess(res, 200, {
      token: newToken,
      refreshToken: newRefreshToken
    }, 'Token refreshed successfully');
  } catch (error) {
    logger.logAuth('token_refresh', null, false, {
      error: error.message,
      ip: req.ip
    });
    throw new AppError('Invalid refresh token', 401);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendSuccess(res, 200, { user }, 'User profile retrieved successfully');
});

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(errors)
      }
    });
  }

  const { currentPassword, newPassword } = req.body;

  await User.changePassword(req.user.id, currentPassword, newPassword);

  // Invalidate all existing sessions except current one
  await UserSession.updateMany(
    { userId: req.user.id, tokenHash: { $ne: req.token } },
    { isActive: false }
  );

  logger.logAuth('password_change', req.user.id, true, {
    ip: req.ip
  });

  sendSuccess(res, 200, null, 'Password changed successfully');
});

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 */
const logoutAll = asyncHandler(async (req, res) => {
  // Deactivate all sessions for the user
  await UserSession.updateMany(
    { userId: req.user.id },
    { isActive: false }
  );

  logger.logAuth('logout_all', req.user.id, true, {
    ip: req.ip
  });

  sendSuccess(res, 200, null, 'Logged out from all devices successfully');
});

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  getMe,
  changePassword
};
