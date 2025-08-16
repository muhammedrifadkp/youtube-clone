const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { 
  AppError, 
  asyncHandler, 
  sendSuccess, 
  sendPaginatedResponse,
  formatValidationErrors 
} = require('../middleware/errorMiddleware');

// Get user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Check if requesting own playlists (can see private playlists)
  const includePrivate = req.user && req.user.id === userId;
  const publicCondition = includePrivate ? '' : 'AND p.is_public = true';

  const result = await query(
    `SELECT p.*, u.channel_name
     FROM playlists p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1 ${publicCondition}
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM playlists WHERE user_id = $1 ${publicCondition}`,
    [userId]
  );

  const playlists = result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    videoCount: row.video_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    channelName: row.channel_name
  }));

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, playlists, page, limit, total, 'Playlists retrieved successfully');
});

// Create playlist
const createPlaylist = asyncHandler(async (req, res) => {
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

  const { title, description, isPublic = true } = req.body;

  const result = await query(
    `INSERT INTO playlists (user_id, title, description, is_public)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.user.id, title, description, isPublic]
  );

  const playlist = {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    title: result.rows[0].title,
    description: result.rows[0].description,
    isPublic: result.rows[0].is_public,
    videoCount: result.rows[0].video_count,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at
  };

  sendSuccess(res, 201, { playlist }, 'Playlist created successfully');
});

// Get playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT p.*, u.channel_name, u.avatar_url
     FROM playlists p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Playlist not found', 404);
  }

  const playlist = result.rows[0];

  // Check if playlist is private and user is not the owner
  if (!playlist.is_public && (!req.user || req.user.id !== playlist.user_id)) {
    throw new AppError('Playlist not found', 404);
  }

  // Get playlist videos
  const videosResult = await query(
    `SELECT v.*, pv.position, u.channel_name as video_channel_name
     FROM playlist_videos pv
     JOIN videos v ON pv.video_id = v.id
     JOIN users u ON v.user_id = u.id
     WHERE pv.playlist_id = $1 AND v.is_public = true
     ORDER BY pv.position ASC`,
    [id]
  );

  const playlistData = {
    id: playlist.id,
    userId: playlist.user_id,
    title: playlist.title,
    description: playlist.description,
    isPublic: playlist.is_public,
    videoCount: playlist.video_count,
    createdAt: playlist.created_at,
    updatedAt: playlist.updated_at,
    channelName: playlist.channel_name,
    channelAvatar: playlist.avatar_url,
    videos: videosResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      viewCount: row.view_count,
      createdAt: row.created_at,
      channelName: row.video_channel_name,
      position: row.position
    }))
  };

  sendSuccess(res, 200, { playlist: playlistData }, 'Playlist retrieved successfully');
});

// Update playlist
const updatePlaylist = asyncHandler(async (req, res) => {
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
  const { title, description, isPublic } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramCount}`);
    values.push(title);
    paramCount++;
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (isPublic !== undefined) {
    updates.push(`is_public = $${paramCount}`);
    values.push(isPublic);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id, req.user.id);

  const result = await query(
    `UPDATE playlists SET ${updates.join(', ')}
     WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Playlist not found or not authorized', 404);
  }

  const playlist = {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    title: result.rows[0].title,
    description: result.rows[0].description,
    isPublic: result.rows[0].is_public,
    videoCount: result.rows[0].video_count,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at
  };

  sendSuccess(res, 200, { playlist }, 'Playlist updated successfully');
});

// Delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM playlists WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (result.rowCount === 0) {
    throw new AppError('Playlist not found or not authorized', 404);
  }

  sendSuccess(res, 200, null, 'Playlist deleted successfully');
});

// Add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { videoId } = req.body;

  // Check if playlist exists and user owns it
  const playlistResult = await query(
    'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (playlistResult.rows.length === 0) {
    throw new AppError('Playlist not found or not authorized', 404);
  }

  // Check if video exists
  const videoResult = await query('SELECT id FROM videos WHERE id = $1', [videoId]);
  if (videoResult.rows.length === 0) {
    throw new AppError('Video not found', 404);
  }

  // Check if video is already in playlist
  const existingResult = await query(
    'SELECT id FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2',
    [id, videoId]
  );

  if (existingResult.rows.length > 0) {
    throw new AppError('Video already in playlist', 409);
  }

  // Get next position
  const positionResult = await query(
    'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM playlist_videos WHERE playlist_id = $1',
    [id]
  );

  const nextPosition = positionResult.rows[0].next_position;

  // Add video to playlist
  await query(
    'INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES ($1, $2, $3)',
    [id, videoId, nextPosition]
  );

  // Update playlist video count
  await query(
    'UPDATE playlists SET video_count = video_count + 1, updated_at = NOW() WHERE id = $1',
    [id]
  );

  sendSuccess(res, 200, null, 'Video added to playlist successfully');
});

// Remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { id, videoId } = req.params;

  // Check if playlist exists and user owns it
  const playlistResult = await query(
    'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (playlistResult.rows.length === 0) {
    throw new AppError('Playlist not found or not authorized', 404);
  }

  const result = await query(
    'DELETE FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2',
    [id, videoId]
  );

  if (result.rowCount === 0) {
    throw new AppError('Video not found in playlist', 404);
  }

  // Update playlist video count
  await query(
    'UPDATE playlists SET video_count = GREATEST(video_count - 1, 0), updated_at = NOW() WHERE id = $1',
    [id]
  );

  sendSuccess(res, 200, null, 'Video removed from playlist successfully');
});

module.exports = {
  getUserPlaylists,
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist
};
