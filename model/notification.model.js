import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Register',
    required: true
  },
  type: {
    type: String,
    enum: ['pair_request', 'pair_accepted', 'pair_rejected', 'admin_message', 'listing_blocked', 'listing_deleted', 'account_blocked'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Register'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index-lər
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;