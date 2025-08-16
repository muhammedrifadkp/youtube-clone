const mongoose = require('mongoose');

// Playlist Schema
const playlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    maxlength: 1000
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  videos: [{
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  videoCount: {
    type: Number,
    default: 0,
    min: 0
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
playlistSchema.index({ userId: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ createdAt: -1 });
playlistSchema.index({ 'videos.videoId': 1 });

// Update video count when videos array changes
playlistSchema.pre('save', function(next) {
  this.videoCount = this.videos.length;
  next();
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
