# 🗺️ Peta Alur Hubungan Kode — Tel-U QnA

Panduan ini menjelaskan cara kerja setiap fitur beserta **potongan kode asli** dari proyek.
Setiap fitur dibagi menjadi 3 bagian: **Frontend → API → Backend & Database**.

---

## Daftar Isi
1. [Login & Register](#1-login--register)
2. [Menampilkan Daftar Pertanyaan](#2-menampilkan-daftar-pertanyaan)
3. [Membuat Pertanyaan Baru](#3-membuat-pertanyaan-baru)
4. [Menjawab & Membalas Komentar](#4-menjawab--membalas-komentar)
5. [Upvote (Suka)](#5-upvote-suka)
6. [Memilih Jawaban Terbaik](#6-memilih-jawaban-terbaik)
7. [Notifikasi](#7-notifikasi)
8. [View Count Anti-Spam](#8-view-count-anti-spam)
9. [Sistem Admin](#9-sistem-admin)
10. [Kategori & Tag Management](#10-kategori--tag-management)

---

## 1. Login & Register

### Langkah 1 — User mengisi form login
📄 **File:** `src/pages/AuthPage.jsx`

```jsx
// User mengetik username & password, lalu klik "Masuk"
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post(
      isLogin ? '/auth/login' : '/auth/register',
      isLogin ? { username, password } : { username, email, password }
    );
    // Simpan token & data user ke browser
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    navigate('/forum');
  } catch (err) {
    setError(err.response?.data?.error || 'Terjadi kesalahan');
  }
};
```

### Langkah 2 — Token otomatis ditempel di setiap request
📄 **File:** `src/services/api.js`

```javascript
// Setiap kali frontend mengirim request, token dari localStorage
// otomatis ditempelkan di header agar backend tahu siapa usernya
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Langkah 3 — Backend memverifikasi identitas user
📄 **File:** `server/routes/auth.js`

```javascript
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Cari user berdasarkan username di database
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Username tidak ditemukan' });

  // Cek apakah user diblokir
  if (user.isBanned) return res.status(403).json({ error: 'Akun ini telah diblokir' });

  // Bandingkan password yang diketik dengan hash di database
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Password salah' });

  // Buat "kartu identitas digital" (JWT Token) berisi id, username, role
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Kirim token kembali ke frontend
  res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
});
```

### Langkah 4 — Validasi email domain (@student.telkomuniversity.ac.id)
📄 **File:** `server/routes/auth.js`

```javascript
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validasi: hanya email @student.telkomuniversity.ac.id yang boleh mendaftar
  if (!email.endsWith('@student.telkomuniversity.ac.id')) {
    return res.status(400).json({ error: 'Hanya email @student.telkomuniversity.ac.id yang diizinkan' });
  }

  // Cek apakah username/email sudah ada
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) return res.status(400).json({ error: 'Username atau email sudah digunakan' });

  // Enkripsi password dan simpan
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: passwordHash });

  // Buat token untuk user baru
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, user: { id: user._id, username, email, role: user.role } });
});
```

### 🔗 Hubungan Antar File:
```
AuthPage.jsx → api.js → server/routes/auth.js → server/models/User.js (MongoDB)
                ↑                                        ↓
        (tempel token)                          (cek password & buat JWT)
```

---

## 2. Menampilkan Daftar Pertanyaan

### Langkah 1 — Frontend meminta data ke backend
📄 **File:** `src/pages/ForumPage.jsx`

```jsx
// Fetch posts dengan filter dari URL params
const fetchPosts = useCallback(async () => {
  setLoading(true);
  const params = {};
  if (searchParams.get('search')) params.search = searchParams.get('search');
  if (activeCategory) params.categoryId = activeCategory;
  if (activeStatus) params.status = activeStatus;
  if (activeSort === 'trending') params.sort = 'trending';

  const res = await api.get('/posts', { params });
  setPosts(res.data);
  setLoading(false);
}, [activeCategory, activeStatus, activeSort, searchParams]);
```

### Langkah 2 — Backend mencari data di database
📄 **File:** `server/routes/posts.js`

```javascript
// GET /api/posts — tampilkan daftar pertanyaan dengan filter
router.get('/', async (req, res) => {
  const { categoryId, sort, status, search } = req.query;

  // Selalu filter: hanya tampilkan yang BELUM dihapus
  const filter = { isDeleted: false };

  // Tambahkan filter sesuai parameter dari frontend
  if (categoryId) filter.categoryId = categoryId;
  if (status === 'solved') filter.isSolved = true;
  if (status === 'unsolved') filter.isSolved = false;

  // Jika ada kata pencarian, gunakan Full-Text Search MongoDB
  if (search) {
    filter.$text = { $search: search };
  }

  // Ambil data + gabungkan nama author dan kategori
  let posts = await Post.find(filter)
    .populate('authorId', 'username')
    .populate('categoryId', 'name slug')
    .populate('tags', 'name')
    .sort({ createdAt: -1 });

  // Jika sorting trending, urutkan berdasarkan jumlah upvote
  if (sort === 'trending') {
    posts.sort((a, b) => b.upvotes.length - a.upvotes.length);
  }

  posts = posts.slice(0, 20);
  res.json(posts);
});
```

### Langkah 3 — Data dirender ke kartu postingan
📄 **File:** `src/components/PostCard.jsx`

```jsx
// PostCard dengan styling card-based modern
export default function PostCard({ post, isAdmin = false, onDelete, onRestore }) {
  const isSolved = post.isSolved;
  const isDeleted = post.isDeleted;

  return (
    <Link to={`/forum/${post._id}`} style={{
      display: 'block', background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)', borderRadius: 16,
      padding: 20, textDecoration: 'none', transition: 'all 0.2s ease',
    }}>
      {/* Badge untuk solved */}
      {isSolved && <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-solved)' }}>Terjawab</span>}

      {/* Title */}
      <h3>{post.title}</h3>

      {/* Vote count */}
      <div style={{ fontSize: 18, fontWeight: 700 }}>{post.upvoteCount} votes</div>
    </Link>
  );
}
```

### 🔗 Hubungan Antar File:
```
ForumPage.jsx → api.js → server/routes/posts.js → server/models/Post.js (MongoDB)
      ↓                                                    ↑
  PostCard.jsx                                    .populate('authorId')
  (render kartu)                                  (gabungkan data User)
```

---

## 3. Membuat Pertanyaan Baru

### Langkah 1 — User mengisi form pertanyaan
📄 **File:** `src/pages/AskPage.jsx`

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  // Validasi: judul, isi, dan kategori wajib diisi
  if (!title.trim() || !body.trim() || !categoryId) {
    setError('Judul, detail, dan kategori wajib diisi');
    return;
  }

  // Kirim data pertanyaan ke backend
  await api.post('/posts', { title, body, categoryId, tags });
  navigate('/forum');  // Kembali ke halaman forum
};
```

### Langkah 2 — Backend menyimpan pertanyaan + mendaftarkan tag
📄 **File:** `server/routes/posts.js`

```javascript
// POST /api/posts — buat pertanyaan baru
router.post('/', auth, async (req, res) => {
  const { title, body, categoryId, tags: tagNames } = req.body;

  // Untuk setiap tag yang dikirim user:
  const tagIds = [];
  for (const name of tagNames) {
    let tag = await Tag.findOne({ name: name.trim().toLowerCase() });
    if (!tag) {
      tag = await Tag.create({ name: name.trim().toLowerCase() });
    }
    await Tag.updateOne({ _id: tag._id }, { $inc: { postCount: 1 } });
    tagIds.push(tag._id);
  }

  // Simpan pertanyaan baru ke database
  const post = await Post.create({
    title, body, authorId: req.user.id, categoryId, tags: tagIds,
  });

  res.status(201).json(post);
});
```

### 🔗 Hubungan Antar File:
```
AskPage.jsx ──→ api.js ──→ server/routes/posts.js ──→ Post.js (simpan pertanyaan)
      ↓                            ↓
  TagInput.jsx               Tag.js (cari/buat tag baru)
```

---

## 4. Menjawab & Membalas Komentar

### Langkah 1 — User menulis jawaban di halaman detail
📄 **File:** `src/pages/DetailPage.jsx`

```jsx
// Fungsi mengirim jawaban baru
const handleSubmitAnswer = async (e) => {
  e.preventDefault();
  await api.post(`/posts/${postId}/comments`, { body: answerText });
  setAnswerText('');
  const res = await api.get(`/posts/${postId}/comments`);
  setComments(res.data);
};
```

### Langkah 2 — Komponen CommentCard merender balasan secara bertingkat
📄 **File:** `src/components/CommentCard.jsx`

```jsx
// Hitung balasan anak dari komentar ini
const derivedChildren = useMemo(
  () => allComments.filter(c => c.parentId === comment._id),
  [allComments, comment._id]
);

// Render balasan secara REKURSIF
{children.map((child) => (
  <CommentCard
    key={child._id}
    comment={child}
    allComments={allComments}
  />
))}
```

### Langkah 3 — Backend menyimpan komentar + kirim notifikasi
📄 **File:** `server/routes/comments.js`

```javascript
// POST /api/posts/:postId/comments — buat jawaban atau balasan
router.post('/:postId/comments', auth, async (req, res) => {
  const { body, parentId } = req.body;

  const post = await Post.findOne({ _id: req.params.postId, isDeleted: false });
  const comment = await Comment.create({
    postId: req.params.postId, authorId: req.user.id, body,
    parentId: parentId || null,
  });

  // Kirim notifikasi otomatis
  const sender = await User.findById(req.user.id).select('username');

  if (parentId) {
    const parentComment = await Comment.findById(parentId);
    if (parentComment && parentComment.authorId.toString() !== req.user.id) {
      await Notification.create({
        userId: parentComment.authorId, type: 'new_reply',
        postId: req.params.postId, message: `${sender.username} membalas komentar Anda`,
      });
    }
  } else {
    if (post.authorId.toString() !== req.user.id) {
      await Notification.create({
        userId: post.authorId, type: 'new_answer',
        postId: post._id, message: `${sender.username} menjawab pertanyaan "${post.title}"`,
      });
    }
  }

  res.status(201).json(comment);
});
```

### 🔗 Hubungan Antar File:
```
DetailPage.jsx ──→ api.js ──→ comments.js ──→ Comment.js (simpan komentar)
      ↓                            ↓
  CommentCard.jsx           Notification.js (kirim notifikasi otomatis)
```

---

## 5. Upvote (Suka)

### Frontend — Tombol upvote di halaman detail
📄 **File:** `src/pages/DetailPage.jsx`

```jsx
const handleUpvote = async () => {
  const res = await api.put(`/posts/${postId}/upvote`);
  setUpvoted(res.data.upvoted);
  setUpvoteCount(res.data.upvoteCount);
};
```

### Backend — Logika toggle (tambah/hapus)
📄 **File:** `server/routes/posts.js`

```javascript
// PUT /api/posts/:id/upvote — toggle upvote
router.put('/:id/upvote', auth, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isDeleted: false });

  const existingIdx = post.upvotes.findIndex(u => u.userId.toString() === req.user.id);

  if (existingIdx > -1) {
    post.upvotes.splice(existingIdx, 1);
  } else {
    post.upvotes.push({ userId: req.user.id });
  }

  await post.save();

  res.json({
    upvoteCount: post.upvotes.length,
    upvoted: existingIdx === -1
  });
});
```

### 🔗 Hubungan Antar File:
```
DetailPage.jsx (upvote post) ──→ posts.js ──→ Post.js (array upvotes)
CommentCard.jsx (upvote jawaban) ──→ comments.js ──→ Comment.js (array upvotes)
```

---

## 6. Memilih Jawaban Terbaik

### Frontend — Tombol muncul hanya untuk pemilik pertanyaan
📄 **File:** `src/components/CommentCard.jsx`

```jsx
// Tombol ini hanya tampil jika:
// 1. User yang login adalah pemilik pertanyaan (isPostOwner)
// 2. Komentar ini belum terpilih sebagai terbaik (!isAccepted)
{isPostOwner && !isAccepted && !comment.parentId && (
  <button onClick={() => onAccept(comment._id)}>
    ✓ Pilih sebagai jawaban terbaik
  </button>
)}
```

### Backend — Validasi & update status
📄 **File:** `server/routes/posts.js`

```javascript
// PUT /api/posts/:id/solve — tandai pertanyaan sebagai terjawab
router.put('/:id/solve', auth, async (req, res) => {
  const { commentId } = req.body;

  const post = await Post.findOne({ _id: req.params.id, authorId: req.user.id });
  if (!post) return res.status(403).json({ error: 'Bukan pemilik pertanyaan' });

  const comment = await Comment.findOne({ _id: commentId, postId: post._id, isDeleted: false });
  if (!comment) return res.status(400).json({ error: 'Komentar tidak valid' });

  post.isSolved = true;
  post.acceptedCommentId = commentId;
  await post.save();

  await Comment.updateMany({ postId: post._id, isAccepted: true }, { isAccepted: false });
  comment.isAccepted = true;
  await comment.save();

  // Kirim notifikasi reward
  if (comment.authorId.toString() !== req.user.id) {
    await Notification.create({
      userId: comment.authorId, type: 'answer_accepted',
      postId: post._id, message: 'Jawaban Anda dipilih sebagai jawaban terbaik!',
    });
  }

  res.json({ success: true });
});
```

### 🔗 Hubungan Antar File:
```
CommentCard.jsx ──→ DetailPage.jsx (handleAccept) ──→ posts.js (/solve)
                                                          ↓
                                                    Comment.js (isAccepted: true)
                                                    Post.js (isSolved: true)
                                                    Notification.js (reward notif)
```

---

## 7. Notifikasi

### Kapan notifikasi dibuat? (Backend — Otomatis)
| Pemicu | Lokasi Kode | Tipe Notifikasi | Penerima |
|:---|:---|:---|:---|
| Ada jawaban baru | `comments.js` | `new_answer` | Pemilik pertanyaan |
| Ada balasan komentar | `comments.js` | `new_reply` | Pemilik komentar |
| Jawaban terpilih | `posts.js` | `answer_accepted` | Penulis jawaban |

### Frontend — Menampilkan daftar notifikasi
📄 **File:** `src/pages/NotifPage.jsx`

```jsx
useEffect(() => {
  api.get('/notifications').then(res => setNotifications(res.data));
}, []);

const handleRead = async (id) => {
  await api.put(`/notifications/${id}/read`);
  setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
};
```

### 🔗 Hubungan Antar File:
```
NotifPage.jsx ──→ api.js ──→ notifications.js ──→ Notification.find({userId}) ──→ DB
```

---

## 8. View Count Anti-Spam

### Cara kerja — Hanya hitung 1x per user
📄 **File:** `server/routes/posts.js`

```javascript
// GET /api/posts/:id — detail pertanyaan
router.get('/:id', async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isDeleted: false });

  if (userId) {
    const alreadyViewed = post.viewers.some(v => v.toString() === userId);

    if (!alreadyViewed) {
      post.viewers.push(userId);
      post.viewCount += 1;
      await post.save();
    }
  }

  res.json(post);
});
```

### 🔗 Hubungan:
```
DetailPage.jsx ──→ posts.js (GET /:id) ──→ Post.js
                                              ↓
                                    Cek array "viewers"
                                    Jika belum ada → viewCount + 1
                                    Jika sudah ada → skip (anti-spam)
```

---

## 9. Sistem Admin

### A. Admin Middleware (Proteksi Route)
📄 **File:** `server/middleware/admin.js`

```javascript
// Middleware untuk melindungi route admin
export default async function admin(req, res, next) {
  // Cek apakah sudah ada user dari middleware auth
  if (!req.user) return res.status(401).json({ error: 'Token tidak ditemukan' });

  // Cek apakah user tidak diblokir
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  if (user.isBanned) return res.status(403).json({ error: 'Akun diblokir' });

  // Cek apakah role-nya admin
  if (user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak' });

  req.user.role = user.role;
  next();
}
```

### B. Admin Dashboard Stats
📄 **File:** `server/routes/admin.js`

```javascript
// GET /api/admin/dashboard — statistik forum
router.get('/dashboard', async (req, res) => {
  const [totalPosts, totalComments, totalSolved, totalUsers, activeUsers, bannedUsers] = await Promise.all([
    Post.countDocuments({ isDeleted: false }),
    Comment.countDocuments({ isDeleted: false }),
    Post.countDocuments({ isDeleted: false, isSolved: true }),
    User.countDocuments(),
    User.countDocuments({ isBanned: false }),
    User.countDocuments({ isBanned: true }),
  ]);

  res.json({ stats: { totalPosts, totalComments, totalSolved, totalUsers, activeUsers, bannedUsers } });
});
```

### C. Ban/Unban User
📄 **File:** `server/routes/admin.js`

```javascript
// PUT /api/admin/users/:id/ban — blokir user
router.put('/users/:id/ban', async (req, res) => {
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
});

// PUT /api/admin/users/:id/unban — aktifkan user
router.put('/users/:id/unban', async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isBanned = false;
  await user.save();

  res.json({ success: true, message: 'User berhasil diaktifkan kembali' });
});
```

### D. Admin Route Protection di Frontend
📄 **File:** `src/App.jsx`

```javascript
// Komponen pelindung untuk halaman admin
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== 'admin') return <Navigate to="/forum" replace />;

  return children;
}

// Penggunaan
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
```

### E. Admin bisa hapus post/komentar langsung dari halaman utama
📄 **File:** `src/components/PostCard.jsx`

```jsx
// Jika user adalah admin, tampilkan tombol Hapus/Pulihkan
{isAdmin && (
  <button onClick={handleAdminAction}>
    {isDeleted ? 'Pulihkan' : 'Hapus'}
  </button>
)}
```

### 🔗 Hubungan Antar File:
```
AdminDashboard.jsx ──→ api.js ──→ admin.js ──→ User.js / Post.js / Comment.js
      ↓
UserManagement.jsx (ban/unban)
PostManagement.jsx (delete/restore)
CommentManagement.jsx (delete/restore)
```

---

## 10. Kategori & Tag Management

### A. List Kategori
📄 **File:** `server/routes/meta.js`

```javascript
// GET /api/categories
router.get('/', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});
```

### B. Admin Tambah Kategori
📄 **File:** `server/routes/admin.js`

```javascript
// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

  // Generate slug dari nama
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existing = await Category.findOne({ slug });
  if (existing) return res.status(400).json({ error: 'Kategori dengan nama serupa sudah ada' });

  const category = await Category.create({ name, slug, description: description || '' });
  res.status(201).json({ success: true, category });
});
```

### C. Admin Hapus Kategori
📄 **File:** `server/routes/admin.js`

```javascript
// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  const postCount = await Post.countDocuments({ categoryId: req.params.id, isDeleted: false });
  if (postCount > 0) {
    return res.status(400).json({ error: `Tidak bisa menghapus. Ada ${postCount} post yang menggunakan kategori ini` });
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Kategori berhasil dihapus' });
});
```

### D. Admin Tambah/Remove Tag
📄 **File:** `server/routes/admin.js`

```javascript
// POST /api/admin/tags
router.post('/tags', async (req, res) => {
  const { name } = req.body;
  const existing = await Tag.findOne({ name: name.toLowerCase().trim() });
  if (existing) return res.status(400).json({ error: 'Tag sudah ada' });

  const tag = await Tag.create({ name: name.toLowerCase().trim(), postCount: 0 });
  res.status(201).json({ success: true, tag });
});

// DELETE /api/admin/tags/:id
router.delete('/tags/:id', async (req, res) => {
  await Tag.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Tag berhasil dihapus' });
});
```

### 🔗 Hubungan Antar File:
```
CategoryManagement.jsx ──→ api.js ──→ admin.js ──→ Category.js / Tag.js
```

---

## 📊 Tabel Ringkasan: Fitur → File

| Fitur | Frontend (React) | Backend (Express) | Database (MongoDB) |
|:---|:---|:---|:---|
| Login/Register | `AuthPage.jsx` | `auth.js` | `User.js` |
| Daftar Pertanyaan | `ForumPage.jsx` + `PostCard.jsx` | `posts.js` (GET /) | `Post.js` |
| Buat Pertanyaan | `AskPage.jsx` + `TagInput.jsx` | `posts.js` (POST /) | `Post.js` + `Tag.js` |
| Komentar/Balasan | `DetailPage.jsx` + `CommentCard.jsx` | `comments.js` | `Comment.js` |
| Upvote | `DetailPage.jsx` + `CommentCard.jsx` | `posts.js` + `comments.js` | `Post.js` + `Comment.js` |
| Jawaban Terbaik | `CommentCard.jsx` | `posts.js` (/solve) | `Post.js` + `Comment.js` |
| Notifikasi | `NotifPage.jsx` | `notifications.js` | `Notification.js` |
| Keamanan Token | `api.js` | `middleware/auth.js` | — |
| Sistem Admin | `AdminDashboard.jsx`, `UserManagement.jsx` | `admin.js` | `User.js` |
| Kategori/Tag | `CategoryManagement.jsx` | `admin.js` | `Category.js`, `Tag.js` |