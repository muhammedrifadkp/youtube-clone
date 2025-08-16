const { validationResult } = require('express-validator');
const Video = require('../models/Video');
const { query } = require('../config/database');
const { 
  AppError, 
  asyncHandler, 
  sendSuccess, 
  sendPaginatedResponse,
  formatValidationErrors 
} = require('../middleware/errorMiddleware');
const { getFileUrl, cleanupFiles } = require('../middleware/uploadMiddleware');
const videoProcessor = require('../utils/videoProcessor');
const { logger } = require('../utils/logger');
const path = require('path');

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
 *                 description: Video file
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Video thumbnail (optional)
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *       400:
 *         description: Validation error or invalid file
 */
const uploadVideo = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Clean up uploaded files on validation error
    cleanupFiles(req.files);
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(errors)
      }
    });
  }

  if (!req.files || !req.files.video) {
    throw new AppError('Video file is required', 400);
  }

  const videoFile = req.files.video[0];
  const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

  try {
    // Validate video file
    const validation = await videoProcessor.validateVideo(videoFile.path);
    if (!validation.isValid) {
      cleanupFiles(req.files);
      throw new AppError(`Invalid video file: ${validation.errors.join(', ')}`, 400);
    }

    // Get video information
    const videoInfo = await videoProcessor.getVideoInfo(videoFile.path);

    // Generate thumbnail if not provided
    let thumbnailUrl = null;
    if (thumbnailFile) {
      thumbnailUrl = getFileUrl(req, thumbnailFile.filename, 'thumbnails');
    } else {
      try {
        const thumbnailPath = await videoProcessor.generateThumbnail(videoFile.path);
        const thumbnailFilename = path.basename(thumbnailPath);
        thumbnailUrl = getFileUrl(req, thumbnailFilename, 'thumbnails');
      } catch (error) {
        logger.warn('Failed to generate thumbnail:', error.message);
      }
    }

    // Parse tags
    const tags = req.body.tags ? 
      req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    // Create video record
    const video = await Video.create({
      userId: req.user.id,
      categoryId: req.body.categoryId || null,
      title: req.body.title,
      description: req.body.description || '',
      videoUrl: getFileUrl(req, videoFile.filename, 'videos'),
      thumbnailUrl,
      duration: videoInfo.duration,
      fileSize: videoInfo.fileSize,
      videoQuality: req.body.videoQuality || '720p',
      isPublic: req.body.isPublic !== 'false',
      tags
    });

    logger.logVideo('upload', video.id, req.user.id, {
      title: video.title,
      duration: video.duration,
      fileSize: video.fileSize
    });

    sendSuccess(res, 201, { video }, 'Video uploaded successfully');
  } catch (error) {
    // Clean up files on error
    cleanupFiles(req.files);
    throw error;
  }
});

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
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *       404:
 *         description: Video not found
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id);
  if (!video) {
    throw new AppError('Video not found', 404);
  }

  // Increment view count (async, don't wait)
  Video.incrementViews(
    id, 
    req.user?.id, 
    req.ip, 
    req.get('User-Agent')
  ).catch(error => {
    logger.error('Failed to increment view count:', error);
  });

  sendSuccess(res, 200, { video }, 'Video retrieved successfully');
});

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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, trending, popular]
 *           default: recent
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 */
const getVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const categoryId = req.query.category;
  const sort = req.query.sort || 'recent';

  let videos;
  let total;

  switch (sort) {
    case 'trending':
      videos = await Video.getTrending(limit);
      total = videos.length; // For trending, we don't paginate
      break;
    case 'recent':
    default:
      videos = await Video.getRecent(limit, categoryId);
      // Get total count for pagination
      const countQuery = categoryId ? 
        'SELECT COUNT(*) FROM videos WHERE is_public = true AND category_id = $1' :
        'SELECT COUNT(*) FROM videos WHERE is_public = true';
      const countParams = categoryId ? [categoryId] : [];
      const countResult = await query(countQuery, countParams);
      total = parseInt(countResult.rows[0].count);
      break;
  }

  if (sort === 'trending') {
    sendSuccess(res, 200, { videos }, 'Trending videos retrieved successfully');
  } else {
    sendPaginatedResponse(res, videos, page, limit, total, 'Videos retrieved successfully');
  }
});

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
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               isPublic:
 *                 type: boolean
 *               isMonetized:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       404:
 *         description: Video not found or not authorized
 */
const updateVideo = asyncHandler(async (req, res) => {
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

  const { id } = req.params;
  const updateData = {};

  // Only include fields that are provided
  const allowedFields = ['title', 'description', 'categoryId', 'isPublic', 'isMonetized'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      // Convert camelCase to snake_case for database
      const dbField = field === 'categoryId' ? 'category_id' : 
                     field === 'isPublic' ? 'is_public' :
                     field === 'isMonetized' ? 'is_monetized' : field;
      updateData[dbField] = req.body[field];
    }
  });

  const video = await Video.update(id, req.user.id, updateData);

  sendSuccess(res, 200, { video }, 'Video updated successfully');
});

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
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       404:
 *         description: Video not found or not authorized
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Video.delete(id, req.user.id);

  sendSuccess(res, 200, null, 'Video deleted successfully');
});

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
const getVideosByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Check if requesting own videos (can see private videos)
  const includePrivate = req.user && req.user.id === userId;

  const videos = await Video.findByUserId(userId, page, limit, includePrivate);

  // Get total count
  const countQuery = includePrivate ? 
    'SELECT COUNT(*) FROM videos WHERE user_id = $1' :
    'SELECT COUNT(*) FROM videos WHERE user_id = $1 AND is_public = true';
  const countResult = await query(countQuery, [userId]);
  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, videos, page, limit, total, 'User videos retrieved successfully');
});

module.exports = {
  uploadVideo,
  getVideoById,
  getVideos,
  updateVideo,
  deleteVideo,
  getVideosByUser
};
