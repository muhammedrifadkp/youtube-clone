const mongoose = require('mongoose');

// Video View Schema (for analytics)
const videoViewSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous views
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  watchDuration: {
    type: Number,
    min: 0 // in seconds
  },
  country: {
    type: String,
    trim: true,
    maxlength: 2 // ISO country code
  },
  city: {
    type: String,
    trim: true
  }
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
videoViewSchema.index({ videoId: 1 });
videoViewSchema.index({ userId: 1 });
videoViewSchema.index({ createdAt: -1 });
videoViewSchema.index({ ipAddress: 1 });
videoViewSchema.index({ videoId: 1, createdAt: -1 });

const VideoView = mongoose.model('VideoView', videoViewSchema);

module.exports = VideoView;
