import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  upvotes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  viewCount: { type: Number, default: 0 },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isSolved: { type: Boolean, default: false },
  acceptedCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

// Indexes sesuai spesifikasi
postSchema.index({ authorId: 1 });
postSchema.index({ categoryId: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ categoryId: 1, createdAt: -1 });
postSchema.index({ isSolved: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, isSolved: 1, _id: -1 });
postSchema.index({ title: 'text', body: 'text' });

export default mongoose.model('Post', postSchema);
