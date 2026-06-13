import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import notifRoutes from './routes/notifications.js';
import metaRoutes from './routes/meta.js';
import adminRoutes from './routes/admin.js';

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);        // /api/posts/:postId/comments
app.use('/api/comments', commentRoutes);      // /api/comments/:id/upvote
app.use('/api/notifications', notifRoutes);
app.use('/api', metaRoutes);                  // /api/categories, /api/tags
app.use('/api/admin', adminRoutes);            // Admin routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
