# Dokumentasi Teknis: Tel-U QnA

---

## 1. Penjelasan Arsitektur Database (Analogi Restoran)

1. **Mesin MongoDB (`mongod.exe`)** = Koki di dalam dapur. Mesin ini aslinya udah nyala otomatis di *background* Windows tiap laptop nyala.
2. **Aplikasi Backend (Node.js)** = Pelayan. Dia langsung konek ke dapur (port 27017) lewat library Mongoose.
3. **MongoDB Compass** = Cuma **Layar CCTV**. Fungsinya cuma biar kita bisa ngintip data secara visual.

Karena si Pelayan udah bisa langsung ngomong sama si Koki, webnya tetap bisa jalan tanpa harus buka CCTV (Compass) sama sekali!

---

## 2. Relasi Data di MongoDB (Populate)

📍 **File:** Backend Routes

Di tabel `Post`, aku aslinya cuma nyimpen ID si pembuat (`authorId`). Tapi biar pas dimunculin di web bisa langsung keluar nama `username`-nya tanpa harus bikin query nyari user lagi, aku pakai fitur sakti bernama **`.populate()`**.

```javascript
const post = await Post.findById(id)
  .populate('authorId', 'username')       // Tolong gabungin data username dari koleksi User dong!
  .populate('categoryId', 'name slug');   // Gabungin juga nama kategorinya
```

---

## 3. Soft Delete (Hapus Aman)

📍 **File:** `server/routes/posts.js` & `server/routes/comments.js`

Di sistem ini, kita ga pernah beneran ngapus data dari database. Kenapa? Karena kalau dihapus permanent, data ilang selamanya — kalau ada bug atau salah hapus, ga bisa recovery. Solusinya: **Soft Delete**.

Caranya simpel: tiap dokumen punya field `isDeleted`. Kalau user minta hapus, kita cuma ganti nilainya jadi `true`. Data aslinya tetap aman di database.

```javascript
// Hapus pertanyaan — bukan delete beneran, tapi cuma kasih tanda
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  // Soft delete: set isDeleted = true, bukan Post.deleteOne()
  post.isDeleted = true;
  await post.save();

  res.json({ success: true, message: 'Pertanyaan berhasil dihapus' });
});
```

Makanya **semua query** di sistem ini selalu wajib nyertain filter `{ isDeleted: false }`, biar data yang "dihapus" ga ikut tampil:

```javascript
// Ambil post — selalu filter yang belum dihapus
Post.find({ isDeleted: false })

// Hitung statistik — sama, exclude yang dihapus
Post.countDocuments({ isDeleted: false })
```

---

## 4. Full-Text Search (Pencarian Kata Kunci)

📍 **File:** `server/routes/posts.js` & `server/models/Post.js`

Fitur pencarian di forum ini bisa nyari kata kunci di **judul dan isi** pertanyaan sekaligus. Ini bisa jalan karena ada **Text Index** yang dipasang di model Post.

**Step 1 — Pasang Text Index di model:**
```javascript
// Di server/models/Post.js
// Perintah ini bikin MongoDB bisa "ngerti" isi teks dokumen buat keperluan search
postSchema.index({ title: 'text', body: 'text' });
```

**Step 2 — Query pakai `$text`:**
```javascript
// Di server/routes/posts.js
// Kalau ada parameter search di URL (/api/posts?search=...)
if (search) {
  filter.$text = { $search: search };
}

// MongoDB otomatis nyari kata kunci itu di field title dan body
const posts = await Post.find(filter);
```

> Tanpa text index, pencarian kata kunci harus pakai regex yang jauh lebih lambat. Dengan text index, MongoDB udah punya "kamus" tersendiri untuk setiap dokumen.

---

## 5. Array Operators (Operasi Array di Dalam Dokumen)

📍 **File:** `server/routes/posts.js` & `server/routes/comments.js`

Di MongoDB, array bisa disimpen langsung di dalam dokumen. Sistem ini banyak manfaatin ini: field `upvotes` (array objek) dan `tags` (array ObjectId) langsung ada di dalam dokumen `Post`. Ada dua operasi array yang sering dipakai:

### `$push` & `$pull` — Tambah & Hapus Elemen Array

Dipakai buat **toggle upvote** — klik pertama nambahin, klik lagi menghapus:

```javascript
// Di server/routes/posts.js — toggle upvote
const existingIdx = post.upvotes.findIndex(u => u.userId.toString() === req.user.id);

if (existingIdx > -1) {
  // Udah pernah upvote → cabut (splice = hapus dari array)
  post.upvotes.splice(existingIdx, 1);
} else {
  // Belum pernah upvote → tambah
  post.upvotes.push({ userId: req.user.id });
}
await post.save();
```

### `$inc` — Increment Angka Secara Atomic

Dipakai buat **nambah `postCount`** di tag tiap kali ada post baru yang pakai tag itu:

```javascript
// Di server/routes/posts.js — saat user submit pertanyaan baru
for (const name of tagNames) {
  let tag = await Tag.findOne({ name: name.trim().toLowerCase() });
  if (!tag) {
    tag = await Tag.create({ name: name.trim().toLowerCase() });
  }
  // $inc nambahin postCount sebesar 1 secara atomic (aman dari race condition)
  await Tag.updateOne({ _id: tag._id }, { $inc: { postCount: 1 } });
  tagIds.push(tag._id);
}
```

> **Kenapa `$inc` lebih baik dari baca-tambah-simpan manual?** Karena `$inc` itu atomic di level database. Kalau 2 user submit post hampir bersamaan, `$inc` ga akan kehilangan satu pun increment. Kalau pakai cara manual (`tag.postCount += 1; tag.save()`), bisa terjadi *race condition* yang bikin hitungan meleset.

---

## 6. Fitur View Count Anti-Spam

📍 **File:** `server/routes/posts.js`

Biar angka *view* ga nambah terus-terusan tiap kali di-refresh sama orang yang sama, aku bikin logikanya ngecek ID usernya dulu.

```javascript
// Kalau user lagi login (punya userId)
if (userId) {
  // Cek apakah ID usernya udah ada di dalam array viewers post ini?
  const alreadyViewed = post.viewers.some(v => v.toString() === userId);

  if (!alreadyViewed) {
    post.viewers.push(userId); // Masukin ID-nya ke daftar
    post.viewCount += 1;       // Tambahin angka view-nya
    await post.save();
  }
}
```

---

## 7. Statistik Forum (Beranda)

📍 **File:** `server/routes/posts.js`

Di halaman forum ada angka total diskusi, komentar, dsb. Itu cara ngitungnya langsung nembak ke database pakai perintah bawaan `countDocuments()`. Cepat dan akurat.

```javascript
const totalPosts = await Post.countDocuments({ isDeleted: false });
const totalComments = await Comment.countDocuments({ isDeleted: false });
const totalSolved = await Post.countDocuments({ isDeleted: false, isSolved: true });
const totalUsers = await User.countDocuments();
```

---

## 8. Fitur Trending (Sorting Javascript)

📍 **File:** `server/routes/posts.js`

Buat nampilin 5 pertanyaan terpopuler (Trending), logikanya cukup simple. Aku ambil semua data post dari database, terus aku urutin secara manual pakai fungsi `.sort()` dari Javascript, lalu dipotong ambil 5 teratas.

```javascript
let posts = await Post.find({ isDeleted: false }).populate('authorId', 'username');

// Urutkan menurun berdasarkan jumlah isi array upvotes
posts.sort((a, b) => b.upvotes.length - a.upvotes.length);

// Ambil top 5 aja
posts = posts.slice(0, 5);
```

---

## 9. Sistem Otentikasi Berbasis JWT (JSON Web Token)

Aplikasi ini pakai JWT buat login. Konsepnya kayak **"KTP Digital"**. Setelah aku berhasil login, server bakal ngasih token KTP ini. Tiap kali mau ngakses fitur penting (kayak bikin post), KTP ini wajib dibawa. Enaknya, server ga perlu capek nginget siapa yang lagi login, karena semua identitasku udah nempel di dalam token itu.

### A. Pas Bikin Token (Login & Register)

📍 **File:** `server/routes/auth.js`

Saat login sukses, server langsung ngebungkus dataku jadi token dan ngirim ke browser.
```javascript
// Bikin Token JWT, umurnya 7 hari
const token = jwt.sign(
  { id: user._id, username: user.username, role: user.role },  // Data yang diselipin ke KTP
  process.env.JWT_SECRET,                      // Kunci gembok rahasia
  { expiresIn: '7d' }                         // Masa berlaku
);

// Kirim ke browser
res.json({
  token,
  user: { id: user._id, username: user.username, email: user.email, role: user.role }
});
```

### B. Pas Pengecekan Token (Middleware Keamanan)

📍 **File:** `server/middleware/auth.js`

Tiap kali ada request masuk (misal mau nge-post), ada file "satpam" yang ngecek tokennya asli atau palsu.
```javascript
export default function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Kalo asli, datanya disimpen biar bisa dipake di proses selanjutnya
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}
```

---

## 10. Enkripsi Password (Bcrypt)

📍 **File:** `server/routes/auth.js`

Aku ga pernah nyimpen password mentah-mentah di database (bahaya banget!). Sebelum disimpan, password diacak dulu pakai library `bcryptjs`. Jadi kalaupun databasenya jebol, orang cuma liat teks acak.

**Pas Register (Diacak):**
```javascript
// Ngacak password pakai bcrypt
const passwordHash = await bcrypt.hash(password, 10);

const user = new User({ username, email, password: passwordHash });
await user.save();
```

**Pas Login (Dicocokkan):**
```javascript
// Ngebandingin password yang diketik sama hasil acakan di database
const valid = await bcrypt.compare(password, user.password);
if (!valid) return res.status(400).json({ error: 'Password salah' });
```

---

## 11. Sistem Admin

### A. Admin Middleware

📍 **File:** `server/middleware/admin.js`

Middleware ini melindungi semua route admin. Dia cek:
1. Apakah token valid?
2. Apakah user ada di database?
3. Apakah user tidak diblokir (`isBanned`)?
4. Apakah role-nya `admin`?

```javascript
export default async function admin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Token tidak ditemukan' });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  if (user.isBanned) return res.status(403).json({ error: 'Akun diblokir' });

  if (user.role !== 'admin') return res.status(403).json({ error: 'Akses ditolak' });

  req.user.role = user.role;
  next();
}
```

### B. Model User dengan Role & Ban

📍 **File:** `server/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
```

### C. Fitur Ban/Unban User

📍 **File:** `server/routes/admin.js`

Admin bisa blokir user yang melanggar aturan. Tidak bisa blokir diri sendiri atau admin lain.

```javascript
// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user._id.toString() === req.user.id) {
    return res.status(400).json({ error: 'Tidak bisa memblokir akun sendiri' });
  }
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Tidak bisa memblokir admin lain' });
  }

  user.isBanned = true;
  await user.save();

  res.json({ success: true, message: 'User berhasil diblokir' });
});
```

### D. Soft Delete untuk Post & Comment oleh Admin

Admin bisa hapus post/komentar menggunakan soft delete (`isDeleted = true`). Data tidak benar-benar dihapus dan bisa dipulihkan.

```javascript
// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.isDeleted = true;
  await post.save();

  res.json({ success: true, message: 'Pertanyaan berhasil dihapus' });
});

// POST /api/admin/posts/:id/restore — pulihkan post
router.post('/posts/:id/restore', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.isDeleted = false;
  await post.save();

  res.json({ success: true, message: 'Pertanyaan berhasil dipulihkan' });
});
```

---

## 12. Validasi Email Domain (@student.telkomuniversity.ac.id)

📍 **File:** `server/routes/auth.js`

Hanya email dengan domain `@student.telkomuniversity.ac.id` yang boleh mendaftar. Ini memastikan hanya mahasiswa Telkom University yang bisa bergabung.

```javascript
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validasi: hanya email @student.telkomuniversity.ac.id
  if (!email.endsWith('@student.telkomuniversity.ac.id')) {
    return res.status(400).json({ error: 'Hanya email @student.telkomuniversity.ac.id yang diizinkan' });
  }

  // ... lanjut simpan user
});
```

---

## 13. Kategori & Tag Management

📍 **File:** `server/routes/admin.js`

Admin bisa menambah dan menghapus kategori serta tag dari dashboard admin.

### Kategori:
```javascript
// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = await Category.findOne({ slug });
  if (existing) return res.status(400).json({ error: 'Kategori dengan nama serupa sudah ada' });

  const category = await Category.create({ name, slug, description: description || '' });
  res.status(201).json({ success: true, category });
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  // Cek apakah ada post yang pakai kategori ini
  const postCount = await Post.countDocuments({ categoryId: req.params.id, isDeleted: false });
  if (postCount > 0) {
    return res.status(400).json({ error: `Tidak bisa menghapus. Ada ${postCount} post yang menggunakan kategori ini` });
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Kategori berhasil dihapus' });
});
```

### Tag:
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

---

## 14. Trik Frontend 1: Axios Interceptors (Pencegat API)

📍 **File:** `src/services/api.js`

Biar aku ga capek ngetik nempelin token JWT satu-satu tiap kali mau *fetch* data ke backend, aku bikin sistem "Pencegat Otomatis" di Axios.

Dia bakal ngecegat tiap *request* keluar dan nempelin token. Kalo pas *request* ternyata tokennya ditolak (dapat error 401 karena kadaluarsa), sistem otomatis ngehapus tokennya dan nendang aku balik ke halaman `/login`.

```javascript
// Nyegat pas mau jalan (nempelin token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Nyegat pas nerima balasan error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 15. Trik Frontend 2: Protected Route & Admin Route

📍 **File:** `src/App.jsx`

Diberdayakan aku bikin komponen pelindung bernama `<ProtectedRoute>` dan `<AdminRoute>`. Halaman yang dibungkus pakai ini ga akan bisa dibuka kalau belum login atau bukan admin.

```javascript
// Komponen pelindung untuk halaman yang butuh login
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Komponen pelindung untuk halaman admin
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== 'admin') return <Navigate to="/forum" replace />;

  return children;
}

// Routes
<Route path="/tanya" element={<ProtectedRoute><AskPage /></ProtectedRoute>} />
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
```

---

## 16. UI/UX Card-Based Modern

📍 **Files:** `src/pages/ForumPage.jsx`, `src/pages/DetailPage.jsx`, `src/components/PostCard.jsx`, `src/components/CommentCard.jsx`

Aplikasi menggunakan desain card-based modern dengan:
- **Cards**: border-radius 16px, subtle box-shadow, hover effect (translateY -2px)
- **Accents**: primary blue (#3B82F6) + purple (#8B5CF6)
- **Layout**: 2 kolom (feed + right panel), search + kategori bersebelahan
- **Status pills**: filter Semua / Belum Terjawab / Sudah Terjawab

---

## 17. Panduan Baca Data Pakai Terminal (mongosh)

Kalau mau ngeliatin isi database tanpa Compass, aku bisa buka terminal (CMD/PowerShell) dan pakai **MongoDB Shell**.

*(Catatan: Kalo dapet error "mongosh is not recognized", itu cuma karena terminalnya belom ke-refresh. Tinggal tutup terminalnya, terus buka terminal baru).*

**Cara Pakainya:**
1. Masuk ke mode shell: ketik `mongosh`
2. Liat daftar database: `show dbs`
3. Masuk ke database web ini: `use teluqna`
4. Liat nama tabelnya: `show collections`

**Contoh Query (Ngambil Data):**
```javascript
// Liat semua pengguna biar rapi
db.users.find().pretty()

// Nyari pengguna spesifik
db.users.find({ username: "andi" }).pretty()

// Ngitung total postingan
db.posts.countDocuments()

// Kalo udah kelar demo, ketik ini buat keluar:
exit
```