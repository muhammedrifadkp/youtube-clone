const express = require('express');
const { query } = require('express-validator');
const {
  searchVideos,
  searchChannels,
  getSearchSuggestions,
  getTrendingSearches
} = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const searchValidation = [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters long')
    .trim()
];

const suggestionValidation = [
  query('q')
    .isLength({ min: 1 })
    .withMessage('Search term must be at least 1 character long')
    .trim()
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

const videoSearchFilters = [
  query('category')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format'),
  
  query('duration')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Duration must be one of: short, medium, long'),
  
  query('uploadDate')
    .optional()
    .isIn(['hour', 'today', 'week', 'month', 'year'])
    .withMessage('Upload date must be one of: hour, today, week, month, year'),
  
  query('sortBy')
    .optional()
    .isIn(['relevance', 'upload_date', 'view_count', 'rating'])
    .withMessage('Sort by must be one of: relevance, upload_date, view_count, rating')
];

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search functionality for videos, channels, and content discovery
 */

/**
 * @swagger
 * /api/search/videos:
 *   get:
 *     summary: Search videos with advanced filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *         example: 'javascript tutorial'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of results per page
 *         example: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *         example: '123e4567-e89b-12d3-a456-426614174000'
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *           enum: [short, medium, long]
 *         description: Filter by duration (short < 4min, medium 4-20min, long > 20min)
 *         example: 'medium'
 *       - in: query
 *         name: uploadDate
 *         schema:
 *           type: string
 *           enum: [hour, today, week, month, year]
 *         description: Filter by upload date
 *         example: 'week'
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, upload_date, view_count, rating]
 *           default: relevance
 *         description: Sort order
 *         example: 'relevance'
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                   example: 'Search results retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       400:
 *         description: Invalid search query or parameters
 */
router.get('/videos', 
  searchValidation, 
  paginationValidation, 
  videoSearchFilters, 
  optionalAuth, 
  searchVideos
);

/**
 * @swagger
 * /api/search/channels:
 *   get:
 *     summary: Search channels and users
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *         example: 'tech reviewer'
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Channel search results retrieved successfully
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
 *                   example: 'Channel search results retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid search query
 */
router.get('/channels', searchValidation, paginationValidation, searchChannels);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions for autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Partial search query
 *         example: 'java'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of suggestions to return
 *         example: 5
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
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
 *                   example: 'Search suggestions retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             example: 'javascript tutorial'
 *                           type:
 *                             type: string
 *                             enum: [video, channel, tag]
 *                             example: 'video'
 *                           relevance:
 *                             type: integer
 *                             example: 25
 *       400:
 *         description: Invalid search query
 */
router.get('/suggestions', suggestionValidation, getSearchSuggestions);

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
 *         description: Number of trending searches to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Trending search terms retrieved successfully
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
 *                   example: 'Trending search terms retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     trendingSearches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                             example: 'react tutorial'
 *                           count:
 *                             type: integer
 *                             example: 150
 */
router.get('/trending', getTrendingSearches);

module.exports = router;
