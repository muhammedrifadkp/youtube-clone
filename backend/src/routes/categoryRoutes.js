const express = require('express');
const { param, query } = require('express-validator');
const {
  getCategories,
  getCategoryById,
  getCategoryVideos
} = require('../controllers/categoryController');

const router = express.Router();

// Validation rules
const categoryIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID format')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('sort')
    .optional()
    .isIn(['recent', 'popular', 'trending'])
    .withMessage('Sort must be one of: recent, popular, trending')
];

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Video categories management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all video categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: 'Categories retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: '123e4567-e89b-12d3-a456-426614174000'
 *                           name:
 *                             type: string
 *                             example: 'Technology'
 *                           description:
 *                             type: string
 *                             example: 'Technology and gadget reviews'
 *                           icon:
 *                             type: string
 *                             example: 'TechIcon'
 *                           videoCount:
 *                             type: integer
 *                             example: 150
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *         example: '123e4567-e89b-12d3-a456-426614174000'
 *     responses:
 *       200:
 *         description: Category retrieved successfully
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
 *                   example: 'Category retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         videoCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Category not found
 */
router.get('/:id', categoryIdValidation, getCategoryById);

/**
 * @swagger
 * /api/categories/{id}/videos:
 *   get:
 *     summary: Get videos in a specific category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *         example: '123e4567-e89b-12d3-a456-426614174000'
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
 *         description: Number of videos per page
 *         example: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, popular, trending]
 *           default: recent
 *         description: Sort order
 *         example: recent
 *     responses:
 *       200:
 *         description: Category videos retrieved successfully
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
 *                   example: 'Category videos retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 100
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 20
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                       example: 2
 *                     prevPage:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *       404:
 *         description: Category not found
 */
router.get('/:id/videos', categoryIdValidation, paginationValidation, getCategoryVideos);

module.exports = router;
