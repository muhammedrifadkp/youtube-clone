const mongoose = require('mongoose');
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
 *           description: Video's unique identifier
 *         userId:
 *           type: string
 *           description: ID of the user who uploaded the video
 *         categoryId:
 *           type: string
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
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Video tags
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

// Video Schema
const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    min: 0
  },
  fileSize: {
    type: Number,
    min: 0
  },
  videoQuality: {
    type: String,
    enum: ['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'],
    default: '720p'
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  dislikeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isMonetized: {
    type: Boolean,
    default: false
  },
  uploadStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'completed'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
videoSchema.index({ userId: 1 });
videoSchema.index({ categoryId: 1 });
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ tags: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ viewCount: -1 });
videoSchema.index({ likeCount: -1 });
videoSchema.index({ isPublic: 1 });
videoSchema.index({ uploadStatus: 1 });
videoSchema.index({ isPublic: 1, createdAt: -1 });
videoSchema.index({ isPublic: 1, viewCount: -1, createdAt: -1 });

// Static methods
videoSchema.statics.createVideo = async function(videoData) {
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

  const video = new this({
    userId,
    categoryId,
    title,
    description,
    videoUrl,
    thumbnailUrl,
    duration,
    fileSize,
    videoQuality,
    isPublic,
    tags: tags.map(tag => tag.toLowerCase().trim()),
    uploadStatus: 'completed'
  });

  await video.save();
  logger.info(`Video created: ${video.id} by user ${userId}`);
  return video;
};

videoSchema.statics.findByIdWithUser = async function(id, includePrivate = false) {
  const query = includePrivate ? { _id: id } : { _id: id, isPublic: true };
  
  return await this.findOne(query)
    .populate('userId', 'channelName avatarUrl isVerified')
    .populate('categoryId', 'name');
};

videoSchema.statics.findByUserId = async function(userId, page = 1, limit = 20, includePrivate = false) {
  const skip = (page - 1) * limit;
  const query = includePrivate ? { userId } : { userId, isPublic: true };

  return await this.find(query)
    .populate('userId', 'channelName avatarUrl isVerified')
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

videoSchema.statics.getTrending = async function(limit = 20, timeframe = 7) {
  const timeframeDate = new Date();
  timeframeDate.setDate(timeframeDate.getDate() - timeframe);

  return await this.find({
    isPublic: true,
    createdAt: { $gte: timeframeDate }
  })
  .populate('userId', 'channelName avatarUrl isVerified')
  .populate('categoryId', 'name')
  .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
  .limit(limit);
};

videoSchema.statics.getRecent = async function(limit = 20, categoryId = null) {
  const query = { isPublic: true };
  if (categoryId) {
    query.categoryId = categoryId;
  }

  return await this.find(query)
    .populate('userId', 'channelName avatarUrl isVerified')
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

videoSchema.statics.searchVideos = async function(searchTerm, page = 1, limit = 20, filters = {}) {
  const skip = (page - 1) * limit;
  const query = { isPublic: true };

  // Text search
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // Apply filters
  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.duration) {
    switch (filters.duration) {
      case 'short':
        query.duration = { $lt: 240 };
        break;
      case 'medium':
        query.duration = { $gte: 240, $lte: 1200 };
        break;
      case 'long':
        query.duration = { $gt: 1200 };
        break;
    }
  }

  if (filters.uploadDate) {
    const now = new Date();
    let dateFilter;
    switch (filters.uploadDate) {
      case 'hour':
        dateFilter = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'today':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    if (dateFilter) {
      query.createdAt = { $gte: dateFilter };
    }
  }

  // Sort order
  let sort = { createdAt: -1 };
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'relevance':
        sort = searchTerm ? { score: { $meta: 'textScore' }, viewCount: -1 } : { viewCount: -1, createdAt: -1 };
        break;
      case 'upload_date':
        sort = { createdAt: -1 };
        break;
      case 'view_count':
        sort = { viewCount: -1 };
        break;
      case 'rating':
        sort = { likeCount: -1 };
        break;
    }
  }

  return await this.find(query)
    .populate('userId', 'channelName avatarUrl isVerified')
    .populate('categoryId', 'name')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

videoSchema.statics.updateVideo = async function(id, userId, updateData) {
  const allowedFields = [
    'title', 'description', 'categoryId', 'thumbnailUrl', 
    'isPublic', 'isMonetized'
  ];

  const updates = {};
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const video = await this.findOneAndUpdate(
    { _id: id, userId },
    updates,
    { new: true }
  );

  if (!video) {
    throw new AppError('Video not found or not authorized', 404);
  }

  logger.info(`Video updated: ${id} by user ${userId}`);
  return video;
};

videoSchema.statics.deleteVideo = async function(id, userId) {
  const video = await this.findOneAndDelete({ _id: id, userId });

  if (!video) {
    throw new AppError('Video not found or not authorized', 404);
  }

  logger.info(`Video deleted: ${id} by user ${userId}`);
  return true;
};

videoSchema.statics.incrementViews = async function(id, userId = null, ipAddress = null, userAgent = null) {
  await this.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  
  // Record view for analytics (would be implemented with a separate Views collection)
  logger.info(`View recorded for video: ${id} by user: ${userId || 'anonymous'}`);
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
