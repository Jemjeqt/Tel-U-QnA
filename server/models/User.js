import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ isBanned: 1 });

export default mongoose.model('User', userSchema);
