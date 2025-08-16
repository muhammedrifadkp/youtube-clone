const mongoose = require('mongoose');

// Comment Schema
const commentSchema = new mongoose.Schema({
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
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
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
  isEdited: {
    type: Boolean,
    default: false
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
commentSchema.index({ videoId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ videoId: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
