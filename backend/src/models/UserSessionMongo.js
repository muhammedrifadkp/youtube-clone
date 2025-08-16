const mongoose = require('mongoose');

// User Session Schema (for JWT token management)
const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
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
userSessionSchema.index({ userId: 1 });
userSessionSchema.index({ tokenHash: 1 });
userSessionSchema.index({ expiresAt: 1 });
userSessionSchema.index({ isActive: 1 });

// TTL index to automatically remove expired sessions
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UserSession = mongoose.model('UserSession', userSessionSchema);

module.exports = UserSession;
