const express = require('express');
const { body, param, query } = require('express-validator');
const {
  updateProfile,
  getUserById,
  subscribeToChannel,
  unsubscribeFromChannel,
  getSubscriptions,
  searchUsers,
  getTrendingChannels
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters')
    .trim(),
  
  body('channelName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Channel name cannot exceed 100 characters')
    .trim(),
  
  body('channelDescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Channel description cannot exceed 1000 characters')
    .trim(),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  
  body('bannerUrl')
    .optional()
    .isURL()
    .withMessage('Banner URL must be a valid URL')
];

const userIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format')
];

const searchValidation = [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters long')
    .trim()
];

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user's profile
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
 *                 example: 'John'
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 example: 'Doe'
 *               channelName:
 *                 type: string
 *                 maxLength: 100
 *                 example: 'John Doe Channel'
 *               channelDescription:
 *                 type: string
 *                 maxLength: 1000
 *                 example: 'Welcome to my channel where I share amazing content!'
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: 'https://example.com/avatar.jpg'
 *               bannerUrl:
 *                 type: string
 *                 format: uri
 *                 example: 'https://example.com/banner.jpg'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.put('/profile', protect, updateProfileValidation, updateProfile);

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
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'User profile retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             video_count:
 *                               type: integer
 *                               example: 25
 *                             comment_count:
 *                               type: integer
 *                               example: 150
 *                             subscription_count:
 *                               type: integer
 *                               example: 50
 *       404:
 *         description: User not found
 */
router.get('/:id', userIdValidation, getUserById);

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
 *         description: Channel ID to subscribe to
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *       400:
 *         description: Cannot subscribe to yourself
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Channel not found
 *       409:
 *         description: Already subscribed
 */
router.post('/:id/subscribe', protect, userIdValidation, subscribeToChannel);

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
 *         description: Channel ID to unsubscribe from
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Subscription not found
 */
router.delete('/:id/unsubscribe', protect, userIdValidation, unsubscribeFromChannel);

/**
 * @swagger
 * /api/users/subscriptions:
 *   get:
 *     summary: Get current user's subscriptions
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/subscriptions', protect, getSubscriptions);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users and channels
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid search query
 */
router.get('/search', searchValidation, searchUsers);

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
 *         description: Number of channels to return
 *     responses:
 *       200:
 *         description: Trending channels retrieved successfully
 */
router.get('/trending', getTrendingChannels);

module.exports = router;
