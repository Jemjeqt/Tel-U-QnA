import { Router } from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = Router();

// Semua route admin memerlukan auth + admin middleware
router.use(auth, admin);

// GET /api/admin/dashboard - Statistik forum
router.get('/dashboard', async (req, res) => {
  try {
    const [totalPosts, totalComments, totalSolved, totalUsers, activeUsers, bannedUsers] = await Promise.all([
      Post.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      Post.countDocuments({ isDeleted: false, isSolved: true }),
      User.countDocuments(),
      User.countDocuments({ isBanned: false }),
      User.countDocuments({ isBanned: true }),
    ]);

    // Recent posts
    const recentPosts = await Post.find({ isDeleted: false })
      .populate('authorId', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: { totalPosts, totalComments, totalSolved, totalUsers, activeUsers, bannedUsers },
      recentPosts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - List semua user
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, banned } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (banned !== undefined) filter.isBanned = banned === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/ban - Blokir user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    // Tidak bisa blokir diri sendiri
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Tidak bisa memblokir akun sendiri' });
    }

    // Tidak bisa blokir admin lain
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Tidak bisa memblokir admin lain' });
    }

    user.isBanned = true;
    await user.save();

    res.json({ success: true, message: 'User berhasil diblokir' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/unban - Aktifkan user
router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    user.isBanned = false;
    await user.save();

    res.json({ success: true, message: 'User berhasil diaktifkan kembali' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/posts - List semua post (termasuk deleted)
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, deleted } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }
    if (deleted !== undefined) filter.isDeleted = deleted === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('authorId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter)
    ]);

    res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/posts/:id - Hapus post (admin bisa hapus apapun)
router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Pertanyaan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/posts/:id/restore - Pulihkan post
router.post('/posts/:id/restore', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });

    post.isDeleted = false;
    await post.save();

    res.json({ success: true, message: 'Pertanyaan berhasil dipulihkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/comments - List semua komentar
router.get('/comments', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, deleted } = req.query;

    const filter = {};
    if (search) {
      filter.body = { $regex: search, $options: 'i' };
    }
    if (deleted !== undefined) filter.isDeleted = deleted === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('authorId', 'username')
        .populate('postId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Comment.countDocuments(filter)
    ]);

    res.json({ comments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/comments/:id - Hapus komentar
router.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

    comment.isDeleted = true;
    await comment.save();

    res.json({ success: true, message: 'Komentar berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/comments/:id/restore - Pulihkan komentar
router.post('/comments/:id/restore', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

    comment.isDeleted = false;
    await comment.save();

    res.json({ success: true, message: 'Komentar berhasil dipulihkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CATEGORY MANAGEMENT ============

// GET /api/admin/categories - List semua kategori
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const withCounts = await Promise.all(categories.map(async (cat) => {
      const postCount = await Post.countDocuments({ categoryId: cat._id, isDeleted: false });
      return { ...cat.toObject(), postCount };
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/categories - Tambah kategori
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

    // Generate slug dari nama
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Cek jika slug sudah ada
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ error: 'Kategori dengan nama serupa sudah ada' });

    const category = await Category.create({ name, slug, description: description || '' });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/categories/:id - Update kategori
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

    category.name = name;
    category.slug = slug;
    category.description = description || '';
    await category.save();

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/categories/:id - Hapus kategori
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

    // Cek apakah ada post yang menggunakan kategori ini
    const postCount = await Post.countDocuments({ categoryId: req.params.id, isDeleted: false });
    if (postCount > 0) {
      return res.status(400).json({ error: `Tidak bisa menghapus. Ada ${postCount} post yang menggunakan kategori ini` });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TAG MANAGEMENT ============

// GET /api/admin/tags - List semua tag
router.get('/tags', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ postCount: -1 });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/tags - Tambah tag
router.post('/tags', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama tag wajib diisi' });

    const existing = await Tag.findOne({ name: name.toLowerCase().trim() });
    if (existing) return res.status(400).json({ error: 'Tag sudah ada' });

    const tag = await Tag.create({ name: name.toLowerCase().trim(), postCount: 0 });
    res.status(201).json({ success: true, tag });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/tags/:id - Hapus tag
router.delete('/tags/:id', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag tidak ditemukan' });

    await Tag.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tag berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;