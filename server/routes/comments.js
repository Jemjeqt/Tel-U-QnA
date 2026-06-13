import { Router } from 'express';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/posts/:postId/comments
router.get('/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId, isDeleted: false })
      .populate('authorId', 'username')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:postId/comments — create answer or reply
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { body, parentId } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Jawaban tidak boleh kosong' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });

    const comment = await Comment.create({
      postId: req.params.postId,
      authorId: req.user.id,
      body,
      parentId: parentId || null,
    });

    // Send notification — include actual username
    const sender = await User.findById(req.user.id).select('username');
    const senderName = sender?.username || 'Seseorang';

    if (parentId) {
      // Reply to a comment → notify parent comment author
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.authorId.toString() !== req.user.id) {
        await Notification.create({
          userId: parentComment.authorId,
          type: 'new_reply',
          postId: req.params.postId,
          message: `${senderName} membalas komentar Anda`,
        });
      }
    } else {
      // Top-level answer → notify post owner
      if (post.authorId.toString() !== req.user.id) {
        await Notification.create({
          userId: post.authorId,
          type: 'new_answer',
          postId: post._id,
          message: `${senderName} menjawab pertanyaan "${post.title}"`,
        });
      }
    }

    const populated = await Comment.findById(comment._id).populate('authorId', 'username');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/comments/:id/upvote — toggle upvote on comment
router.put('/:id/upvote', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

    const existingIdx = comment.upvotes.findIndex(u => u.userId.toString() === req.user.id);
    if (existingIdx > -1) {
      comment.upvotes.splice(existingIdx, 1);
    } else {
      comment.upvotes.push({ userId: req.user.id });
    }
    await comment.save();
    res.json({ upvoteCount: comment.upvotes.length, upvoted: existingIdx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comments/:id — hapus komentar (hanya pemilik)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

    // Cek apakah yang menghapus adalah pemilik komentar
    if (comment.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Hanya pemilik komentar yang bisa menghapusnya' });
    }

    // Soft delete: tandai sebagai dihapus
    comment.isDeleted = true;
    await comment.save();

    res.json({ success: true, message: 'Komentar berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

