import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_answer', 'answer_accepted', 'new_reply'],
    required: true
  },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  message: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

// Index sesuai spesifikasi
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
