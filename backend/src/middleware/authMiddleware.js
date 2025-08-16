const jwt = require('jsonwebtoken');
const User = require('../models/UserMongo');
const UserSession = require('../models/UserSessionMongo');
const { AppError, asyncHandler } = require('./errorMiddleware');
const { logger } = require('../utils/logger');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Check if token is in active sessions
    const session = await UserSession.findOne({
      userId: decoded.id,
      tokenHash: token,
      expiresAt: { $gt: new Date() },
      isActive: true
    });

    if (!session) {
      throw new AppError('Token is no longer valid', 401);
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    logger.logAuth('token_verified', req.user.id, true, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.logAuth('invalid_token', null, false, {
        ip: req.ip,
        error: error.message
      });
      throw new AppError('Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      logger.logAuth('token_expired', null, false, {
        ip: req.ip
      });
      throw new AppError('Token expired', 401);
    } else {
      throw error;
    }
  }
});

// Optional authentication - doesn't throw error if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }

  next();
});

// Restrict to specific roles or user ownership
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401);
    }

    // For now, we'll implement basic ownership check
    // In a more complex system, you might have role-based access
    next();
  };
};

// Check if user owns the resource
const checkOwnership = (resourceType) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401);
    }

    const resourceId = req.params.id;
    let ownershipQuery;
    let params = [resourceId];

    let Model;
    switch (resourceType) {
      case 'video':
        Model = require('../models/VideoMongo');
        break;
      case 'comment':
        Model = require('../models/CommentMongo');
        break;
      case 'playlist':
        Model = require('../models/PlaylistMongo');
        break;
      default:
        throw new AppError('Invalid resource type', 400);
    }

    const resource = await Model.findById(resourceId);
    if (!resource) {
      throw new AppError(`${resourceType} not found`, 404);
    }

    if (resource.userId.toString() !== req.user.id.toString()) {
      throw new AppError('Not authorized to access this resource', 403);
    }

    next();
  });
};

// Rate limiting for authenticated users
const authRateLimit = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      throw new AppError('Too many requests, please try again later', 429);
    }

    userRequests.push(now);
    next();
  });
};

// Verify email middleware (for features requiring verified email)
const requireVerifiedEmail = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError('Not authorized', 401);
  }

  // Check if user's email is verified
  const user = await User.findById(req.user.id);
  if (!user || !user.isVerified) {
    throw new AppError('Email verification required for this action', 403);
  }

  next();
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  checkOwnership,
  authRateLimit,
  requireVerifiedEmail,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};
