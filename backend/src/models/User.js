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
 *           format: uuid
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
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    }
  }
});

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

  // Find user by ID
  static async findById(id) {
  const result = await query(
    `SELECT id, username, email, first_name, last_name, channel_name, 
              channel_description, avatar_url, banner_url, subscriber_count, 
              total_views, is_verified, created_at, updated_at
       FROM users WHERE id = $1`,
    [id]
  );

  return result.rows.length > 0 ? new User(result.rows[0]) : null;
}

  // Find user by email
  static async findByEmail(email) {
  const result = await query(
    `SELECT id, username, email, first_name, last_name, channel_name, 
              channel_description, avatar_url, banner_url, subscriber_count, 
              total_views, is_verified, created_at, updated_at, password_hash
       FROM users WHERE email = $1`,
    [email]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

  // Find user by username
  static async findByUsername(username) {
  const result = await query(
    `SELECT id, username, email, first_name, last_name, channel_name, 
              channel_description, avatar_url, banner_url, subscriber_count, 
              total_views, is_verified, created_at, updated_at, password_hash
       FROM users WHERE username = $1`,
    [username]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

  // Update user profile
  static async updateProfile(id, updateData) {
  const allowedFields = [
    'first_name', 'last_name', 'channel_name', 'channel_description',
    'avatar_url', 'banner_url'
  ];

  const updates = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      updates.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    }
  });

  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING id, username, email, first_name, last_name, channel_name, 
                 channel_description, avatar_url, banner_url, subscriber_count, 
                 total_views, is_verified, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  logger.info(`User profile updated: ${id}`);
  return new User(result.rows[0]);
}

  // Change password
  static async changePassword(id, currentPassword, newPassword) {
  // Get current password hash
  const userResult = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, id]
  );

  logger.info(`Password changed for user: ${id}`);
}

  // Get user statistics
  static async getStatistics(id) {
  const result = await query(
    `SELECT 
         u.subscriber_count,
         u.total_views,
         COUNT(DISTINCT v.id) as video_count,
         COUNT(DISTINCT c.id) as comment_count,
         COUNT(DISTINCT s.id) as subscription_count
       FROM users u
       LEFT JOIN videos v ON u.id = v.user_id AND v.is_public = true
       LEFT JOIN comments c ON u.id = c.user_id
       LEFT JOIN subscriptions s ON u.id = s.subscriber_id
       WHERE u.id = $1
       GROUP BY u.id, u.subscriber_count, u.total_views`,
    [id]
  );

  return result.rows[0] || {
    subscriber_count: 0,
    total_views: 0,
    video_count: 0,
    comment_count: 0,
    subscription_count: 0
  };
}

  // Search users
  static async search(searchTerm, limit = 20, offset = 0) {
  const result = await query(
    `SELECT id, username, email, first_name, last_name, channel_name, 
              channel_description, avatar_url, subscriber_count, is_verified,
              created_at
       FROM users 
       WHERE username ILIKE $1 OR channel_name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
       ORDER BY subscriber_count DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
    [`%${searchTerm}%`, limit, offset]
  );

  return result.rows.map(row => new User(row));
}

  // Get trending channels
  static async getTrendingChannels(limit = 10) {
  const result = await query(
    `SELECT u.id, u.username, u.channel_name, u.channel_description, 
              u.avatar_url, u.subscriber_count, u.is_verified,
              COUNT(v.id) as video_count,
              SUM(v.view_count) as total_video_views
       FROM users u
       LEFT JOIN videos v ON u.id = v.user_id AND v.is_public = true
       WHERE u.subscriber_count > 0
       GROUP BY u.id
       ORDER BY u.subscriber_count DESC, total_video_views DESC
       LIMIT $1`,
    [limit]
  );

  return result.rows.map(row => new User(row));
}

  // Delete user account
  static async deleteAccount(id) {
  await transaction(async (client) => {
    // Delete user sessions
    await client.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);

    // Delete user subscriptions
    await client.query('DELETE FROM subscriptions WHERE subscriber_id = $1 OR channel_id = $1', [id]);

    // Delete user reactions
    await client.query('DELETE FROM video_reactions WHERE user_id = $1', [id]);
    await client.query('DELETE FROM comment_reactions WHERE user_id = $1', [id]);

    // Delete user comments
    await client.query('DELETE FROM comments WHERE user_id = $1', [id]);

    // Delete user videos (this will cascade to related data)
    await client.query('DELETE FROM videos WHERE user_id = $1', [id]);

    // Delete user playlists
    await client.query('DELETE FROM playlists WHERE user_id = $1', [id]);

    // Finally delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
  });

  logger.info(`User account deleted: ${id}`);
}
}

module.exports = User;
