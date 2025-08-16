const express = require('express');
const { param } = require('express-validator');
const {
  getVideoAnalytics,
  getChannelAnalytics,
  getPlatformAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const videoIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid video ID format')
];

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and statistics
 */

// Get video analytics
router.get('/video/:id', protect, videoIdValidation, getVideoAnalytics);

// Get channel analytics
router.get('/channel', protect, getChannelAnalytics);

// Get platform analytics (admin only)
router.get('/platform', protect, getPlatformAnalytics);

module.exports = router;
