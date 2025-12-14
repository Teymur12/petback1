
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Register',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: [true, 'Mesaj tələb olunur'],
    trim: true
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

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Register',
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    type: String,
    trim: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  unreadCount: {
    user: {
      type: Number,
      default: 0
    },
    admin: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

chatSchema.index({ user: 1 });
chatSchema.index({ 'messages.createdAt': -1 });
chatSchema.index({ lastMessageAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;