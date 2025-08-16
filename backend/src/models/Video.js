const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorMiddleware');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       required:
 *         - title
 *         - videoUrl
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Video's unique identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who uploaded the video
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: Video category ID
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Video title
 *         description:
 *           type: string
 *           description: Video description
 *         videoUrl:
 *           type: string
 *           format: uri
 *           description: URL to the video file
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *           description: URL to the video thumbnail
 *         duration:
 *           type: integer
 *           minimum: 0
 *           description: Video duration in seconds
 *         fileSize:
 *           type: integer
 *           minimum: 0
 *           description: Video file size in bytes
 *         videoQuality:
 *           type: string
 *           enum: [240p, 360p, 480p, 720p, 1080p, 1440p, 2160p]
 *           description: Video quality
 *         viewCount:
 *           type: integer
 *           minimum: 0
 *           description: Number of views
 *         likeCount:
 *           type: integer
 *           minimum: 0
 *           description: Number of likes
 *         dislikeCount:
 *           type: integer
 *           minimum: 0
 *           description: Number of dislikes
 *         commentCount:
 *           type: integer
 *           minimum: 0
 *           description: Number of comments
 *         isPublic:
 *           type: boolean
 *           description: Whether the video is public
 *         isMonetized:
 *           type: boolean
 *           description: Whether the video is monetized
 *         uploadStatus:
 *           type: string
 *           enum: [processing, completed, failed]
 *           description: Video upload/processing status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

class Video {
  constructor(videoData) {
    this.id = videoData.id;
    this.userId = videoData.user_id;
    this.categoryId = videoData.category_id;
    this.title = videoData.title;
    this.description = videoData.description;
    this.videoUrl = videoData.video_url;
    this.thumbnailUrl = videoData.thumbnail_url;
    this.duration = videoData.duration;
    this.fileSize = videoData.file_size;
    this.videoQuality = videoData.video_quality;
    this.viewCount = videoData.view_count || 0;
    this.likeCount = videoData.like_count || 0;
    this.dislikeCount = videoData.dislike_count || 0;
    this.commentCount = videoData.comment_count || 0;
    this.isPublic = videoData.is_public;
    this.isMonetized = videoData.is_monetized;
    this.uploadStatus = videoData.upload_status;
    this.createdAt = videoData.created_at;
    this.updatedAt = videoData.updated_at;

    // Additional fields that might be joined
    this.channelName = videoData.channel_name;
    this.channelAvatar = videoData.avatar_url;
    this.isVerified = videoData.is_verified;
    this.tags = videoData.tags || [];
  }

  // Create a new video
  static async create(videoData) {
    const {
      userId,
      categoryId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      fileSize,
      videoQuality = '720p',
      isPublic = true,
      tags = []
    } = videoData;

    return await transaction(async (client) => {
      // Insert video
      const videoResult = await client.query(
        `INSERT INTO videos (user_id, category_id, title, description, video_url, 
                           thumbnail_url, duration, file_size, video_quality, is_public, upload_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed')
         RETURNING *`,
        [userId, categoryId, title, description, videoUrl, thumbnailUrl, 
         duration, fileSize, videoQuality, isPublic]
      );

      const video = new Video(videoResult.rows[0]);

      // Insert tags if provided
      if (tags.length > 0) {
        for (const tag of tags) {
          await client.query(
            'INSERT INTO video_tags (video_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [video.id, tag.toLowerCase().trim()]
          );
        }
      }

      logger.logVideo('create', video.id, userId, { title, duration, fileSize });
      return video;
    });
  }

  // Find video by ID with channel info
  static async findById(id, includePrivate = false) {
    const publicCondition = includePrivate ? '' : 'AND v.is_public = true';
    
    const result = await query(
      `SELECT v.*, u.channel_name, u.avatar_url, u.is_verified,
              ARRAY_AGG(DISTINCT vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
       FROM videos v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN video_tags vt ON v.id = vt.video_id
       WHERE v.id = $1 ${publicCondition}
       GROUP BY v.id, u.channel_name, u.avatar_url, u.is_verified`,
      [id]
    );

    return result.rows.length > 0 ? new Video(result.rows[0]) : null;
  }

  // Get videos by user ID
  static async findByUserId(userId, page = 1, limit = 20, includePrivate = false) {
    const offset = (page - 1) * limit;
    const publicCondition = includePrivate ? '' : 'AND v.is_public = true';

    const result = await query(
      `SELECT v.*, u.channel_name, u.avatar_url, u.is_verified,
              ARRAY_AGG(DISTINCT vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
       FROM videos v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN video_tags vt ON v.id = vt.video_id
       WHERE v.user_id = $1 ${publicCondition}
       GROUP BY v.id, u.channel_name, u.avatar_url, u.is_verified
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => new Video(row));
  }

  // Get trending videos
  static async getTrending(limit = 20, timeframe = '7 days') {
    const result = await query(
      `SELECT v.*, u.channel_name, u.avatar_url, u.is_verified,
              ARRAY_AGG(DISTINCT vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
       FROM videos v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN video_tags vt ON v.id = vt.video_id
       WHERE v.is_public = true 
         AND v.created_at > NOW() - INTERVAL '${timeframe}'
       GROUP BY v.id, u.channel_name, u.avatar_url, u.is_verified
       ORDER BY (v.view_count + v.like_count * 10) DESC, v.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => new Video(row));
  }

  // Get recent videos
  static async getRecent(limit = 20, categoryId = null) {
    const categoryCondition = categoryId ? 'AND v.category_id = $2' : '';
    const params = categoryId ? [limit, categoryId] : [limit];

    const result = await query(
      `SELECT v.*, u.channel_name, u.avatar_url, u.is_verified,
              ARRAY_AGG(DISTINCT vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
       FROM videos v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN video_tags vt ON v.id = vt.video_id
       WHERE v.is_public = true ${categoryCondition}
       GROUP BY v.id, u.channel_name, u.avatar_url, u.is_verified
       ORDER BY v.created_at DESC
       LIMIT $1`,
      params
    );

    return result.rows.map(row => new Video(row));
  }

  // Search videos
  static async search(searchTerm, page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let whereConditions = ['v.is_public = true'];
    let params = [`%${searchTerm}%`, limit, offset];
    let paramCount = 3;

    // Add search condition
    whereConditions.push(`(
      v.title ILIKE $1 OR 
      v.description ILIKE $1 OR 
      u.channel_name ILIKE $1 OR
      EXISTS (SELECT 1 FROM video_tags vt WHERE vt.video_id = v.id AND vt.tag ILIKE $1)
    )`);

    // Add filters
    if (filters.categoryId) {
      paramCount++;
      whereConditions.push(`v.category_id = $${paramCount}`);
      params.push(filters.categoryId);
    }

    if (filters.duration) {
      paramCount++;
      switch (filters.duration) {
        case 'short':
          whereConditions.push(`v.duration < $${paramCount}`);
          params.push(240); // 4 minutes
          break;
        case 'medium':
          whereConditions.push(`v.duration BETWEEN $${paramCount} AND $${paramCount + 1}`);
          params.push(240, 1200); // 4-20 minutes
          paramCount++;
          break;
        case 'long':
          paramCount++;
          whereConditions.push(`v.duration > $${paramCount}`);
          params.push(1200); // 20+ minutes
          break;
      }
    }

    if (filters.uploadDate) {
      paramCount++;
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

    // Order by relevance and recency
    let orderBy = 'ORDER BY v.created_at DESC';
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'relevance':
          orderBy = 'ORDER BY (v.view_count + v.like_count * 5) DESC, v.created_at DESC';
          break;
        case 'upload_date':
          orderBy = 'ORDER BY v.created_at DESC';
          break;
        case 'view_count':
          orderBy = 'ORDER BY v.view_count DESC';
          break;
        case 'rating':
          orderBy = 'ORDER BY (v.like_count::float / GREATEST(v.like_count + v.dislike_count, 1)) DESC';
          break;
      }
    }

    const result = await query(
      `SELECT v.*, u.channel_name, u.avatar_url, u.is_verified,
              ARRAY_AGG(DISTINCT vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
       FROM videos v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN video_tags vt ON v.id = vt.video_id
       WHERE ${whereConditions.join(' AND ')}
       GROUP BY v.id, u.channel_name, u.avatar_url, u.is_verified
       ${orderBy}
       LIMIT $2 OFFSET $3`,
      params
    );

    return result.rows.map(row => new Video(row));
  }

  // Update video
  static async update(id, userId, updateData) {
    const allowedFields = [
      'title', 'description', 'category_id', 'thumbnail_url', 
      'is_public', 'is_monetized'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await query(
      `UPDATE videos SET ${updates.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Video not found or not authorized', 404);
    }

    logger.logVideo('update', id, userId, updateData);
    return new Video(result.rows[0]);
  }

  // Delete video
  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM videos WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Video not found or not authorized', 404);
    }

    logger.logVideo('delete', id, userId);
    return true;
  }

  // Increment view count
  static async incrementViews(id, userId = null, ipAddress = null, userAgent = null) {
    await transaction(async (client) => {
      // Update video view count
      await client.query(
        'UPDATE videos SET view_count = view_count + 1 WHERE id = $1',
        [id]
      );

      // Record view for analytics
      await client.query(
        'INSERT INTO video_views (video_id, user_id, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [id, userId, ipAddress, userAgent]
      );
    });

    logger.logVideo('view', id, userId, { ipAddress });
  }
}

module.exports = Video;
