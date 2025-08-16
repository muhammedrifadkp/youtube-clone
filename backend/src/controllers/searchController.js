const { validationResult } = require('express-validator');
const Video = require('../models/Video');
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
 * /api/search/videos:
 *   get:
 *     summary: Search videos
 *     tags: [Search]
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
 *         description: Filter by category
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *           enum: [short, medium, long]
 *         description: Filter by duration (short < 4min, medium 4-20min, long > 20min)
 *       - in: query
 *         name: uploadDate
 *         schema:
 *           type: string
 *           enum: [hour, today, week, month, year]
 *         description: Filter by upload date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, upload_date, view_count, rating]
 *           default: relevance
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid search query
 */
const searchVideos = asyncHandler(async (req, res) => {
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

  const { q: searchTerm } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const filters = {
    categoryId: req.query.category,
    duration: req.query.duration,
    uploadDate: req.query.uploadDate,
    sortBy: req.query.sortBy || 'relevance'
  };

  // Record search history if user is authenticated
  if (req.user) {
    query(
      'INSERT INTO search_history (user_id, search_query) VALUES ($1, $2)',
      [req.user.id, searchTerm]
    ).catch(error => {
      logger.error('Failed to record search history:', error);
    });
  }

  const videos = await Video.search(searchTerm, page, limit, filters);

  // Get total count for pagination
  let whereConditions = ['v.is_public = true'];
  let params = [`%${searchTerm}%`];
  let paramCount = 1;

  whereConditions.push(`(
    v.title ILIKE $1 OR 
    v.description ILIKE $1 OR 
    u.channel_name ILIKE $1 OR
    EXISTS (SELECT 1 FROM video_tags vt WHERE vt.video_id = v.id AND vt.tag ILIKE $1)
  )`);

  if (filters.categoryId) {
    paramCount++;
    whereConditions.push(`v.category_id = $${paramCount}`);
    params.push(filters.categoryId);
  }

  if (filters.duration) {
    switch (filters.duration) {
      case 'short':
        paramCount++;
        whereConditions.push(`v.duration < $${paramCount}`);
        params.push(240);
        break;
      case 'medium':
        paramCount++;
        whereConditions.push(`v.duration BETWEEN $${paramCount} AND $${paramCount + 1}`);
        params.push(240, 1200);
        paramCount++;
        break;
      case 'long':
        paramCount++;
        whereConditions.push(`v.duration > $${paramCount}`);
        params.push(1200);
        break;
    }
  }

  if (filters.uploadDate) {
    switch (filters.uploadDate) {
      case 'hour':
        whereConditions.push(`v.created_at > NOW() - INTERVAL '1 hour'`);
        break;
      case 'today':
        whereConditions.push(`v.created_at > NOW() - INTERVAL '1 day'`);
        break;
      case 'week':
        whereConditions.push(`v.created_at > NOW() - INTERVAL '1 week'`);
        break;
      case 'month':
        whereConditions.push(`v.created_at > NOW() - INTERVAL '1 month'`);
        break;
      case 'year':
        whereConditions.push(`v.created_at > NOW() - INTERVAL '1 year'`);
        break;
    }
  }

  const countResult = await query(
    `SELECT COUNT(DISTINCT v.id) FROM videos v
     JOIN users u ON v.user_id = u.id
     LEFT JOIN video_tags vt ON v.id = vt.video_id
     WHERE ${whereConditions.join(' AND ')}`,
    params
  );

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, videos, page, limit, total, 'Search results retrieved successfully');
});

/**
 * @swagger
 * /api/search/channels:
 *   get:
 *     summary: Search channels/users
 *     tags: [Search]
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
 *         description: Channel search results retrieved successfully
 */
const searchChannels = asyncHandler(async (req, res) => {
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

  const { q: searchTerm } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const users = await User.search(searchTerm, limit, offset);

  const countResult = await query(
    `SELECT COUNT(*) FROM users 
     WHERE username ILIKE $1 OR channel_name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`,
    [`%${searchTerm}%`]
  );

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, users, page, limit, total, 'Channel search results retrieved successfully');
});

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Partial search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 */
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q: searchTerm } = req.query;
  const limit = parseInt(req.query.limit) || 5;

  if (!searchTerm || searchTerm.length < 1) {
    throw new AppError('Search term is required', 400);
  }

  // Get suggestions from video titles, channel names, and tags
  const result = await query(
    `(
      SELECT DISTINCT title as suggestion, 'video' as type, COUNT(*) as relevance
      FROM videos 
      WHERE title ILIKE $1 AND is_public = true
      GROUP BY title
    )
    UNION ALL
    (
      SELECT DISTINCT channel_name as suggestion, 'channel' as type, COUNT(*) as relevance
      FROM users 
      WHERE channel_name ILIKE $1
      GROUP BY channel_name
    )
    UNION ALL
    (
      SELECT DISTINCT tag as suggestion, 'tag' as type, COUNT(*) as relevance
      FROM video_tags vt
      JOIN videos v ON vt.video_id = v.id
      WHERE tag ILIKE $1 AND v.is_public = true
      GROUP BY tag
    )
    ORDER BY relevance DESC, suggestion ASC
    LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );

  const suggestions = result.rows.map(row => ({
    text: row.suggestion,
    type: row.type,
    relevance: parseInt(row.relevance)
  }));

  sendSuccess(res, 200, { suggestions }, 'Search suggestions retrieved successfully');
});

/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Get trending search terms
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending search terms retrieved successfully
 */
const getTrendingSearches = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const result = await query(
    `SELECT search_query, COUNT(*) as search_count
     FROM search_history 
     WHERE created_at > NOW() - INTERVAL '7 days'
     GROUP BY search_query
     ORDER BY search_count DESC, search_query ASC
     LIMIT $1`,
    [limit]
  );

  const trendingSearches = result.rows.map(row => ({
    query: row.search_query,
    count: parseInt(row.search_count)
  }));

  sendSuccess(res, 200, { trendingSearches }, 'Trending search terms retrieved successfully');
});

module.exports = {
  searchVideos,
  searchChannels,
  getSearchSuggestions,
  getTrendingSearches
};
