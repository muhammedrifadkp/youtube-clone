const mongoose = require('mongoose');

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationEnabled: {
    type: Boolean,
    default: true
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
subscriptionSchema.index({ subscriberId: 1 });
subscriptionSchema.index({ channelId: 1 });
subscriptionSchema.index({ subscriberId: 1, channelId: 1 }, { unique: true });
subscriptionSchema.index({ createdAt: -1 });

// Validation to prevent self-subscription
subscriptionSchema.pre('save', function(next) {
  if (this.subscriberId.equals(this.channelId)) {
    const error = new Error('Cannot subscribe to yourself');
    return next(error);
  }
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
