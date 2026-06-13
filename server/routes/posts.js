import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Post from '../models/Post.js';
import Tag from '../models/Tag.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/posts — list posts with filter & sort
router.get('/', async (req, res) => {
  try {
    const { categoryId, tag, sort, status, search, cursor } = req.query;
    const filter = { isDeleted: false };

    if (categoryId) filter.categoryId = categoryId;
    if (tag) filter.tags = tag;
    if (status === 'solved') filter.isSolved = true;
    if (status === 'unsolved') filter.isSolved = false;
    if (cursor) filter._id = { $lt: cursor };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Ambil data dari database menggunakan find biasa
    let posts = await Post.find(filter)
      .populate('authorId', 'username')
      .populate('categoryId', 'name slug')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });

    // Jika sorting = trending, urutkan berdasarkan jumlah upvote menggunakan Javascript
    if (sort === 'trending') {
      posts.sort((a, b) => b.upvotes.length - a.upvotes.length);
    }

    // Batasi hanya 20 data teratas
    posts = posts.slice(0, 20);

    // Hitung jumlah komentar untuk setiap post satu per satu
    const postsWithCounts = [];
    for (const post of posts) {
      const commentCount = await Comment.countDocuments({ postId: post._id, isDeleted: false, parentId: null });
      const postObj = post.toObject();
      postsWithCounts.push({ ...postObj, commentCount, upvoteCount: postObj.upvotes?.length || 0 });
    }

    res.json(postsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/trending — top trending
router.get('/trending', async (req, res) => {
  try {
    // Ambil semua post yang belum dihapus
    let posts = await Post.find({ isDeleted: false })
      .populate('authorId', 'username');

    // Urutkan berdasarkan jumlah upvote terbanyak menggunakan Javascript
    posts.sort((a, b) => b.upvotes.length - a.upvotes.length);

    // Ambil 5 teratas saja
    posts = posts.slice(0, 5);

    // Format data agar sesuai kebutuhan frontend
    const result = posts.map(post => ({
      _id: post._id,
      title: post.title,
      upvoteCount: post.upvotes.length,
      authorId: { username: post.authorId?.username },
      createdAt: post.createdAt,
      isSolved: post.isSolved,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/stats — forum statistics
router.get('/stats', async (req, res) => {
  try {
    // Hitung statistik satu per satu secara berurutan
    const totalPosts = await Post.countDocuments({ isDeleted: false });
    const totalComments = await Comment.countDocuments({ isDeleted: false });
    const totalSolved = await Post.countDocuments({ isDeleted: false, isSolved: true });
    const totalUsers = await User.countDocuments();

    res.json({ totalPosts, totalComments, totalSolved, totalUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id — detail post (unique view per user)
router.get('/:id', async (req, res) => {
  try {
    // Coba ambil userId dari token (opsional, tidak wajib login)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Token tidak valid, tapi tidak apa-apa karena login opsional di halaman ini
      }
    }

    // Cari post berdasarkan ID
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
      .populate('authorId', 'username')
      .populate('categoryId', 'name slug')
      .populate('tags', 'name');

    if (!post) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });

    // Jika user sudah login, cek apakah sudah pernah melihat post ini
    if (userId) {
      const alreadyViewed = post.viewers.some(v => v.toString() === userId);
      if (!alreadyViewed) {
        post.viewers.push(userId);
        post.viewCount += 1;
        await post.save();
      }
    }

    const commentCount = await Comment.countDocuments({ postId: post._id, isDeleted: false, parentId: null });
    res.json({ ...post.toObject(), commentCount, upvoteCount: post.upvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts — create new post
router.post('/', auth, async (req, res) => {
  try {
    const { title, body, categoryId, tags: tagNames } = req.body;

    // Cari atau buat tag baru satu per satu
    const tagIds = [];
    if (tagNames && tagNames.length > 0) {
      for (const name of tagNames) {
        let tag = await Tag.findOne({ name: name.trim().toLowerCase() });
        if (!tag) {
          tag = await Tag.create({ name: name.trim().toLowerCase() });
        }
        await Tag.updateOne({ _id: tag._id }, { $inc: { postCount: 1 } });
        tagIds.push(tag._id);
      }
    }

    const post = await Post.create({
      title,
      body,
      authorId: req.user.id,
      categoryId,
      tags: tagIds,
    });

    const populated = await Post.findById(post._id)
      .populate('authorId', 'username')
      .populate('categoryId', 'name slug')
      .populate('tags', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id/upvote — toggle upvote
router.put('/:id/upvote', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post tidak ditemukan' });

    const existingIdx = post.upvotes.findIndex(u => u.userId.toString() === req.user.id);
    if (existingIdx > -1) {
      post.upvotes.splice(existingIdx, 1); // Remove upvote
    } else {
      post.upvotes.push({ userId: req.user.id });
    }
    await post.save();
    res.json({ upvoteCount: post.upvotes.length, upvoted: existingIdx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id/solve — mark as solved
router.put('/:id/solve', auth, async (req, res) => {
  try {
    const { commentId } = req.body;
    const post = await Post.findOne({ _id: req.params.id, authorId: req.user.id });
    if (!post) return res.status(403).json({ error: 'Hanya pemilik pertanyaan yang bisa menandai jawaban terbaik' });

    // Update status post menjadi terjawab
    post.isSolved = true;
    post.acceptedCommentId = commentId;
    await post.save();

    // Update flag pada comment
    await Comment.updateMany({ postId: post._id, isAccepted: true }, { isAccepted: false });
    const comment = await Comment.findByIdAndUpdate(commentId, { isAccepted: true }, { new: true });

    // Kirim notifikasi ke penjawab
    if (comment && comment.authorId.toString() !== req.user.id) {
      await Notification.create({
        userId: comment.authorId,
        type: 'answer_accepted',
        postId: post._id,
        message: `Jawaban Anda dipilih sebagai jawaban terbaik!`,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id — hapus pertanyaan (hanya pemilik)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });

    // Cek apakah yang menghapus adalah pemilik pertanyaan
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Hanya pemilik pertanyaan yang bisa menghapusnya' });
    }

    // Soft delete: tandai sebagai dihapus, bukan benar-benar dihapus dari database
    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Pertanyaan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

