const mongoose = require('mongoose');

// Video Reaction Schema (likes/dislikes)
const videoReactionSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reactionType: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
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
videoReactionSchema.index({ videoId: 1 });
videoReactionSchema.index({ userId: 1 });
videoReactionSchema.index({ videoId: 1, userId: 1 }, { unique: true });
videoReactionSchema.index({ reactionType: 1 });

const VideoReaction = mongoose.model('VideoReaction', videoReactionSchema);

module.exports = VideoReaction;
