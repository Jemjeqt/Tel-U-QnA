import { Router } from 'express';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import Post from '../models/Post.js';

const router = Router();

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    // Get post count per category
    const withCounts = await Promise.all(categories.map(async (cat) => {
      const postCount = await Post.countDocuments({ categoryId: cat._id, isDeleted: false });
      return { ...cat.toObject(), postCount };
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ postCount: -1 }).limit(20);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
