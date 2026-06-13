import User from '../models/User.js';

export default async function admin(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Akun Anda telah diblokir' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang bisa mengakses fitur ini' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
