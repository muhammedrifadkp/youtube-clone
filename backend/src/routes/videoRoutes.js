const express = require('express');
const { body, param, query } = require('express-validator');
const {
  uploadVideo,
  getVideoById,
  getVideos,
  updateVideo,
  deleteVideo,
  getVideosByUser
} = require('../controllers/videoController');
const { protect, optionalAuth, checkOwnership } = require('../middleware/authMiddleware');
const { 
  uploadVideoWithThumbnail, 
  handleMulterError, 
  cleanupOnError 
} = require('../middleware/uploadMiddleware');

const router = express.Router();

// Validation rules
const uploadVideoValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title cannot exceed 255 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters')
    .trim(),
  
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('videoQuality')
    .optional()
    .isIn(['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'])
    .withMessage('Invalid video quality')
];

const updateVideoValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters')
    .trim(),
  
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('isMonetized')
    .optional()
    .isBoolean()
    .withMessage('isMonetized must be a boolean')
];

const videoIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid video ID format')
];

const userIdValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management and streaming
 */

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *               - title
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (max 500MB)
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Video thumbnail image (optional)
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: 'My Amazing Video'
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: 'This is a description of my amazing video content.'
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: '123e4567-e89b-12d3-a456-426614174000'
 *               tags:
 *                 type: string
 *                 example: 'tutorial,programming,javascript'
 *                 description: Comma-separated tags
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               videoQuality:
 *                 type: string
 *                 enum: [240p, 360p, 480p, 720p, 1080p, 1440p, 2160p]
 *                 default: '720p'
 *     responses:
 *       201:
 *         description: Video uploaded successfully
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
 *                   example: 'Video uploaded successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         description: Validation error or invalid file
 *       401:
 *         description: Not authenticated
 *       413:
 *         description: File too large
 */
router.post('/upload', 
  protect, 
  cleanupOnError,
  uploadVideoWithThumbnail.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  handleMulterError,
  uploadVideoValidation, 
  uploadVideo
);

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get videos with pagination and filters
 *     tags: [Videos]
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
 *         description: Number of videos per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, trending, popular]
 *           default: recent
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 */
router.get('/', paginationValidation, getVideos);

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video retrieved successfully
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
 *                   example: 'Video retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */
router.get('/:id', videoIdValidation, optionalAuth, getVideoById);

/**
 * @swagger
 * /api/videos/{id}:
 *   put:
 *     summary: Update video details
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: 'Updated Video Title'
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: 'Updated video description'
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *               isMonetized:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this video
 *       404:
 *         description: Video not found
 */
router.put('/:id', protect, videoIdValidation, updateVideoValidation, updateVideo);

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     summary: Delete video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to delete this video
 *       404:
 *         description: Video not found
 */
router.delete('/:id', protect, videoIdValidation, deleteVideo);

/**
 * @swagger
 * /api/videos/user/{userId}:
 *   get:
 *     summary: Get videos by user ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
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
 *         description: User videos retrieved successfully
 */
router.get('/user/:userId', userIdValidation, paginationValidation, optionalAuth, getVideosByUser);

module.exports = router;
