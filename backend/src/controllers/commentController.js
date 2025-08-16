const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { 
  AppError, 
  asyncHandler, 
  sendSuccess, 
  sendPaginatedResponse,
  formatValidationErrors 
} = require('../middleware/errorMiddleware');
const { logger } = require('../utils/logger');

// Get comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get top-level comments
  const result = await query(
    `SELECT c.*, u.username, u.channel_name, u.avatar_url, u.is_verified,
            COUNT(replies.id) as reply_count
     FROM comments c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN comments replies ON c.id = replies.parent_comment_id
     WHERE c.video_id = $1 AND c.parent_comment_id IS NULL
     GROUP BY c.id, u.username, u.channel_name, u.avatar_url, u.is_verified
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [videoId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM comments WHERE video_id = $1 AND parent_comment_id IS NULL',
    [videoId]
  );

  const comments = result.rows.map(row => ({
    id: row.id,
    videoId: row.video_id,
    userId: row.user_id,
    content: row.content,
    likeCount: row.like_count,
    dislikeCount: row.dislike_count,
    replyCount: parseInt(row.reply_count),
    isEdited: row.is_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      username: row.username,
      channelName: row.channel_name,
      avatarUrl: row.avatar_url,
      isVerified: row.is_verified
    }
  }));

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, comments, page, limit, total, 'Comments retrieved successfully');
});

// Add a comment
const addComment = asyncHandler(async (req, res) => {
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

  const { videoId } = req.params;
  const { content, parentCommentId } = req.body;

  // Check if video exists
  const videoResult = await query('SELECT id FROM videos WHERE id = $1', [videoId]);
  if (videoResult.rows.length === 0) {
    throw new AppError('Video not found', 404);
  }

  // If it's a reply, check if parent comment exists
  if (parentCommentId) {
    const parentResult = await query(
      'SELECT id FROM comments WHERE id = $1 AND video_id = $2',
      [parentCommentId, videoId]
    );
    if (parentResult.rows.length === 0) {
      throw new AppError('Parent comment not found', 404);
    }
  }

  const result = await query(
    `INSERT INTO comments (video_id, user_id, parent_comment_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [videoId, req.user.id, parentCommentId || null, content]
  );

  // Update video comment count
  await query(
    'UPDATE videos SET comment_count = comment_count + 1 WHERE id = $1',
    [videoId]
  );

  const comment = {
    id: result.rows[0].id,
    videoId: result.rows[0].video_id,
    userId: result.rows[0].user_id,
    parentCommentId: result.rows[0].parent_comment_id,
    content: result.rows[0].content,
    likeCount: result.rows[0].like_count,
    dislikeCount: result.rows[0].dislike_count,
    isEdited: result.rows[0].is_edited,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at
  };

  logger.info(`Comment added: ${comment.id} by user ${req.user.id}`);

  sendSuccess(res, 201, { comment }, 'Comment added successfully');
});

// Update comment
const updateComment = asyncHandler(async (req, res) => {
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
  const { content } = req.body;

  const result = await query(
    `UPDATE comments SET content = $1, is_edited = true, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [content, id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Comment not found or not authorized', 404);
  }

  const comment = {
    id: result.rows[0].id,
    videoId: result.rows[0].video_id,
    userId: result.rows[0].user_id,
    parentCommentId: result.rows[0].parent_comment_id,
    content: result.rows[0].content,
    likeCount: result.rows[0].like_count,
    dislikeCount: result.rows[0].dislike_count,
    isEdited: result.rows[0].is_edited,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at
  };

  logger.info(`Comment updated: ${id} by user ${req.user.id}`);

  sendSuccess(res, 200, { comment }, 'Comment updated successfully');
});

// Delete comment
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING video_id',
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Comment not found or not authorized', 404);
  }

  // Update video comment count
  await query(
    'UPDATE videos SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1',
    [result.rows[0].video_id]
  );

  logger.info(`Comment deleted: ${id} by user ${req.user.id}`);

  sendSuccess(res, 200, null, 'Comment deleted successfully');
});

// Get comment replies
const getCommentReplies = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT c.*, u.username, u.channel_name, u.avatar_url, u.is_verified
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.parent_comment_id = $1
     ORDER BY c.created_at ASC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM comments WHERE parent_comment_id = $1',
    [id]
  );

  const replies = result.rows.map(row => ({
    id: row.id,
    videoId: row.video_id,
    userId: row.user_id,
    parentCommentId: row.parent_comment_id,
    content: row.content,
    likeCount: row.like_count,
    dislikeCount: row.dislike_count,
    isEdited: row.is_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      username: row.username,
      channelName: row.channel_name,
      avatarUrl: row.avatar_url,
      isVerified: row.is_verified
    }
  }));

  const total = parseInt(countResult.rows[0].count);

  sendPaginatedResponse(res, replies, page, limit, total, 'Comment replies retrieved successfully');
});

module.exports = {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getCommentReplies
};
