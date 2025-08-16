const express = require('express');
const { body, param } = require('express-validator');
const {
  getUserPlaylists,
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist
} = require('../controllers/playlistController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const playlistValidation = [
  body('title')
    .notEmpty()
    .withMessage('Playlist title is required')
    .isLength({ max: 255 })
    .withMessage('Title cannot exceed 255 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

const playlistIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid playlist ID format')
];

const userIdValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format')
];

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlist management
 */

// Get user playlists
router.get('/user/:userId', userIdValidation, optionalAuth, getUserPlaylists);

// Create playlist
router.post('/', protect, playlistValidation, createPlaylist);

// Get playlist by ID
router.get('/:id', playlistIdValidation, optionalAuth, getPlaylistById);

// Update playlist
router.put('/:id', protect, playlistIdValidation, playlistValidation, updatePlaylist);

// Delete playlist
router.delete('/:id', protect, playlistIdValidation, deletePlaylist);

// Add video to playlist
router.post('/:id/videos', protect, playlistIdValidation, [
  body('videoId')
    .isUUID()
    .withMessage('Invalid video ID format')
], addVideoToPlaylist);

// Remove video from playlist
router.delete('/:id/videos/:videoId', protect, [
  param('id').isUUID().withMessage('Invalid playlist ID format'),
  param('videoId').isUUID().withMessage('Invalid video ID format')
], removeVideoFromPlaylist);

module.exports = router;
