const { validationResult } = require('express-validator');
const User = require('../models/User');
const { query } = require('../config/database');
const { 
  AppError, 
  asyncHandler, 
  sendSuccess, 
  sendPaginatedResponse,
  formatValidationErrors 
} = require('../middleware/errorMiddleware');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *               channelName:
 *                 type: string
 *                 maxLength: 100
 *               channelDescription:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *               bannerUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
const updateProfile = asyncHandler(async (req, res) => {
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

  const updateData = {};
  const allowedFields = ['firstName', 'lastName', 'channelName', 'channelDescription', 'avatarUrl', 'bannerUrl'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      // Convert camelCase to snake_case for database
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      updateData[dbField] = req.body[field];
    }
  });

  const user = await User.updateProfile(req.user.id, updateData);

  logger.info(`User profile updated: ${req.user.id}`);

  sendSuccess(res, 200, { user }, 'Profile updated successfully');
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user statistics
  const stats = await User.getStatistics(id);

  sendSuccess(res, 200, { 
    user: { ...user, ...stats }
  }, 'User profile retrieved successfully');
});

/**
 * @swagger
 * /api/users/{id}/subscribe:
 *   post:
 *     summary: Subscribe to a channel
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *       400:
 *         description: Cannot subscribe to yourself
 *       409:
 *         description: Already subscribed
 */
const subscribeToChannel = asyncHandler(async (req, res) => {
  const { id: channelId } = req.params;
  const subscriberId = req.user.id;

  if (subscriberId === channelId) {
    throw new AppError('Cannot subscribe to your own channel', 400);
  }

  // Check if channel exists
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // Check if already subscribed
  const existingSubscription = await query(
    'SELECT id FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
    [subscriberId, channelId]
  );

  if (existingSubscription.rows.length > 0) {
    throw new AppError('Already subscribed to this channel', 409);
  }

  // Create subscription
  await query(
    'INSERT INTO subscriptions (subscriber_id, channel_id) VALUES ($1, $2)',
    [subscriberId, channelId]
  );

  // Update subscriber count
  await query(
    'UPDATE users SET subscriber_count = subscriber_count + 1 WHERE id = $1',
    [channelId]
  );

  logger.info(`User ${subscriberId} subscribed to channel ${channelId}`);

  sendSuccess(res, 200, null, 'Subscribed successfully');
});

/**
 * @swagger
 * /api/users/{id}/unsubscribe:
 *   delete:
 *     summary: Unsubscribe from a channel
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       404:
 *         description: Subscription not found
 */
const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  const { id: channelId } = req.params;
  const subscriberId = req.user.id;

  // Delete subscription
  const result = await query(
    'DELETE FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
    [subscriberId, channelId]
  );

  if (result.rowCount === 0) {
    throw new AppError('Subscription not found', 404);
  }

  // Update subscriber count
  await query(
    'UPDATE users SET subscriber_count = GREATEST(subscriber_count - 1, 0) WHERE id = $1',
    [channelId]
  );

  logger.info(`User ${subscriberId} unsubscribed from channel ${channelId}`);

  sendSuccess(res, 200, null, 'Unsubscribed successfully');
});

/**
 * @swagger
 * /api/users/subscriptions:
 *   get:
 *     summary: Get user's subscriptions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 */
const getSubscriptions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT u.id, u.username, u.channel_name, u.channel_description, 
            u.avatar_url, u.subscriber_count, u.is_verified, s.created_at as subscribed_at
     FROM subscriptions s
     JOIN users u ON s.channel_id = u.id
     WHERE s.subscriber_id = $1
     ORDER BY s.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM subscriptions WHERE subscriber_id = $1',
    [req.user.id]
  );

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, result.rows, page, limit, total, 'Subscriptions retrieved successfully');
});

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users/channels
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q: searchTerm } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  if (!searchTerm || searchTerm.length < 2) {
    throw new AppError('Search term must be at least 2 characters long', 400);
  }

  const users = await User.search(searchTerm, limit, offset);

  const countResult = await query(
    `SELECT COUNT(*) FROM users 
     WHERE username ILIKE $1 OR channel_name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`,
    [`%${searchTerm}%`]
  );

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, users, page, limit, total, 'Search results retrieved successfully');
});

/**
 * @swagger
 * /api/users/trending:
 *   get:
 *     summary: Get trending channels
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending channels retrieved successfully
 */
const getTrendingChannels = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const channels = await User.getTrendingChannels(limit);

  sendSuccess(res, 200, { channels }, 'Trending channels retrieved successfully');
});

module.exports = {
  updateProfile,
  getUserById,
  subscribeToChannel,
  unsubscribeFromChannel,
  getSubscriptions,
  searchUsers,
  getTrendingChannels
};
