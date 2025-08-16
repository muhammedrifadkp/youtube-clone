const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorMiddleware');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: User's unique identifier
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: User's unique username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           description: User's first name
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           description: User's last name
 *         channelName:
 *           type: string
 *           maxLength: 100
 *           description: User's channel name
 *         channelDescription:
 *           type: string
 *           description: User's channel description
 *         avatarUrl:
 *           type: string
 *           format: uri
 *           description: URL to user's avatar image
 *         bannerUrl:
 *           type: string
 *           format: uri
 *           description: URL to user's channel banner image
 *         subscriberCount:
 *           type: integer
 *           minimum: 0
 *           description: Number of subscribers
 *         totalViews:
 *           type: integer
 *           minimum: 0
 *           description: Total views across all videos
 *         isVerified:
 *           type: boolean
 *           description: Whether the user is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  channelName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  channelDescription: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  bannerUrl: {
    type: String,
    trim: true
  },
  subscriberCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ channelName: 1 });
userSchema.index({ subscriberCount: -1 });
userSchema.index({ createdAt: -1 });

// Static methods
userSchema.statics.createUser = async function(userData) {
  const { username, email, password, firstName, lastName, channelName } = userData;

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new this({
    username,
    email,
    passwordHash,
    firstName,
    lastName,
    channelName: channelName || username
  });

  await user.save();
  logger.info(`User created: ${username} (${email})`);
  return user;
};

userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username });
};

userSchema.statics.verifyPassword = async function(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

userSchema.statics.updateProfile = async function(id, updateData) {
  const allowedFields = [
    'firstName', 'lastName', 'channelName', 'channelDescription',
    'avatarUrl', 'bannerUrl'
  ];

  const updates = {};
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const user = await this.findByIdAndUpdate(id, updates, { new: true });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  logger.info(`User profile updated: ${id}`);
  return user;
};

userSchema.statics.changePassword = async function(id, currentPassword, newPassword) {
  const user = await this.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  user.passwordHash = newPasswordHash;
  await user.save();

  logger.info(`Password changed for user: ${id}`);
};

userSchema.statics.searchUsers = async function(searchTerm, limit = 20, skip = 0) {
  const regex = new RegExp(searchTerm, 'i');
  return await this.find({
    $or: [
      { username: regex },
      { channelName: regex },
      { firstName: regex },
      { lastName: regex }
    ]
  })
  .sort({ subscriberCount: -1, createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

userSchema.statics.getTrendingChannels = async function(limit = 10) {
  return await this.find({ subscriberCount: { $gt: 0 } })
    .sort({ subscriberCount: -1 })
    .limit(limit);
};

userSchema.statics.deleteAccount = async function(id) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Delete user and related data would be handled by cascade or separate operations
    await this.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    logger.info(`User account deleted: ${id}`);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
