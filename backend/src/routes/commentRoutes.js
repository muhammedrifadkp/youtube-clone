const express = require('express');
const { body, param } = require('express-validator');
const {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getCommentReplies
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const commentValidation = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters')
    .trim()
];

const videoIdValidation = [
  param('videoId')
    .isUUID()
    .withMessage('Invalid video ID format')
];

const commentIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID format')
];

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Video comments management
 */

// Get comments for a video
router.get('/video/:videoId', videoIdValidation, getVideoComments);

// Add a comment to a video
router.post('/video/:videoId', protect, videoIdValidation, commentValidation, addComment);

// Update a comment
router.put('/:id', protect, commentIdValidation, commentValidation, updateComment);

// Delete a comment
router.delete('/:id', protect, commentIdValidation, deleteComment);

// Get replies to a comment
router.get('/:id/replies', commentIdValidation, getCommentReplies);

module.exports = router;
