# Dokumentasi Teknis: Tel-U QnA

Dokumentasi ini berisi penjelasan mengenai fitur-fitur teknis yang diimplementasikan di dalam *backend* dan *frontend* proyek Tel-U QnA. Dirancang untuk membantu anggota kelompok memahami bagaimana kode bekerja agar siap menghadapi sesi presentasi atau tanya jawab dosen.

---

## 1. Sistem Otentikasi Berbasis JWT (JSON Web Token)

Aplikasi ini menggunakan JWT sebagai mekanisme login. Setelah mahasiswa berhasil login, server memberikan sebuah "KTP Digital" (token) yang harus dibawa setiap kali mengakses fitur terproteksi. Server tidak perlu mengingat siapa yang sedang login karena semua informasi sudah ada di dalam token tersebut.

### A. Pembuatan Token (Saat Login & Register)
📍 **File:** `server/routes/auth.js`

Saat mahasiswa berhasil login atau mendaftar, server membuat token JWT berisi identitas pengguna, lalu mengirimkannya ke browser.

```javascript
// Men-generate Token JWT, berlaku selama 7 hari
const token = jwt.sign(
  { id: user._id, username: user.username },  // Data identitas yang dibungkus
  process.env.JWT_SECRET,                      // Kunci rahasia dari file .env
  { expiresIn: '7d' }                         // Masa berlaku token
);

// Token dikirim ke browser bersama data user
res.json({ 
  token, 
  user: { id: user._id, username: user.username, email: user.email } 
});
```

### B. Verifikasi Token (Middleware Keamanan)
📍 **File:** `server/middleware/auth.js`

Saat user mencoba melakukan aksi seperti membuat pertanyaan atau memberi upvote, middleware ini mengecek apakah token yang dikirim oleh browser itu asli atau palsu.

```javascript
import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  // Ambil token dari header request
  const token = req.headers.authorization?.split(' ')[1];

  // Jika tidak ada token, tolak akses
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  try {
    // Cek keaslian token menggunakan kunci rahasia server
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Simpan data user ke dalam request
    next();              // Lanjutkan ke proses berikutnya
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}
```

---

## 2. Enkripsi Password dengan Bcrypt
📍 **File:** `server/routes/auth.js`

Password pengguna tidak pernah disimpan dalam bentuk tulisan asli di database. Sebelum disimpan, password diubah menjadi kode acak (hash) menggunakan library `bcryptjs`. Bahkan admin database pun tidak bisa melihat password aslinya.

### Saat Register (Mengenkripsi Password)
```javascript
import bcrypt from 'bcryptjs';

// Enkripsi password secara manual sebelum disimpan ke database
const passwordHash = await bcrypt.hash(password, 10);

const user = new User({ username, email, passwordHash });
await user.save();
```

### Saat Login (Mencocokkan Password)
```javascript
// Bandingkan password yang diketik user dengan hash yang ada di database
const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) return res.status(400).json({ error: 'Password salah' });
```

---

## 3. Fitur Trending (Sorting dengan Javascript)
📍 **File:** `server/routes/posts.js`

Untuk menampilkan pertanyaan yang paling populer (banyak upvote), sistem mengambil semua data dari database, lalu mengurutkannya menggunakan fungsi `.sort()` bawaan Javascript.

```javascript
// Ambil semua post dari database
let posts = await Post.find({ isDeleted: false })
  .populate('authorId', 'username');

// Urutkan berdasarkan jumlah upvote terbanyak menggunakan Javascript
posts.sort((a, b) => b.upvotes.length - a.upvotes.length);

// Ambil 5 teratas saja
posts = posts.slice(0, 5);
```

---

## 4. Statistik Forum
📍 **File:** `server/routes/posts.js` (Endpoint `/stats`)

Halaman utama menampilkan statistik seperti jumlah total diskusi, komentar, pertanyaan terjawab, dan pengguna. Data ini dihitung satu per satu dari database menggunakan fungsi `countDocuments()` milik MongoDB.

```javascript
// Hitung statistik satu per satu
const totalPosts = await Post.countDocuments({ isDeleted: false });
const totalComments = await Comment.countDocuments({ isDeleted: false });
const totalSolved = await Post.countDocuments({ isDeleted: false, isSolved: true });
const totalUsers = await User.countDocuments();

res.json({ totalPosts, totalComments, totalSolved, totalUsers });
```

---

## 5. Fitur View Count (Unik per User)
📍 **File:** `server/routes/posts.js` (Endpoint `GET /:id`)

Saat membuka detail sebuah diskusi, sistem mengecek apakah pengguna yang sedang login sudah pernah melihat diskusi ini sebelumnya. Jika belum, jumlah viewer akan bertambah. Jika sudah pernah, tidak dihitung lagi agar jumlahnya akurat.

```javascript
// Coba baca token untuk mengetahui siapa yang sedang membuka halaman ini
let userId = null;
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    userId = decoded.id;
  } catch {
    // Jika token tidak valid, abaikan (tamu tetap bisa membaca)
  }
}

// Jika user login dan belum pernah lihat post ini, tambahkan view count
if (userId) {
  const alreadyViewed = post.viewers.some(v => v.toString() === userId);
  if (!alreadyViewed) {
    post.viewers.push(userId);
    post.viewCount += 1;
    await post.save();
  }
}
```

---

## 6. Relasi Antar Koleksi (Populate)

Salah satu kekuatan utama MongoDB + Mongoose di proyek ini adalah penggunaan **populate** untuk menghubungkan data antar koleksi. Misalnya, sebuah Post menyimpan `authorId` yang merujuk ke koleksi User. Dengan `.populate()`, kita bisa langsung mendapatkan data username tanpa harus menulis query tambahan.

```javascript
const post = await Post.findById(id)
  .populate('authorId', 'username')       // Gabungkan data User (ambil username-nya saja)
  .populate('categoryId', 'name slug')    // Gabungkan data Category
  .populate('tags', 'name');              // Gabungkan data Tag
```

---

## 7. Operasi CRUD Lengkap

Proyek ini mengimplementasikan semua operasi dasar database (CRUD):

| Operasi   | Method | Endpoint               | Fungsi                          |
| :-------- | :----- | :--------------------- | :------------------------------ |
| **Create** | POST   | `/api/posts`           | Membuat pertanyaan baru         |
| **Read**   | GET    | `/api/posts`           | Melihat daftar pertanyaan       |
| **Read**   | GET    | `/api/posts/:id`       | Melihat detail pertanyaan       |
| **Update** | PUT    | `/api/posts/:id/upvote`| Memberi/menghapus upvote        |
| **Update** | PUT    | `/api/posts/:id/solve` | Menandai pertanyaan terjawab    |

---

## 8. Frontend React: Axios Interceptors (Pencegat API)
📍 **File:** `src/services/api.js`

Biasanya programmer pemula akan memasukkan token ke dalam *header* secara manual satu per satu di setiap fungsi pengambilan data. Proyek ini menggunakan **Axios Interceptor** yang bertindak sebagai "Pencegat Otomatis".

Kapanpun aplikasi (frontend) ingin mengambil atau mengirim data ke server, Interceptor akan menempelkan token KTP Digital ke dalam koneksi secara otomatis. Jika server membalas dengan error 401 (Token Kadaluarsa), Interceptor akan langsung menendang pengguna kembali ke halaman Login.

```javascript
// Memasang token secara otomatis ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Menangani error jika token sudah kadaluarsa (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 9. Frontend React: Protected Route (Pembungkus Keamanan URL)
📍 **File:** `src/App.jsx`

Daripada mengecek status login di setiap halaman satu per satu (misal di halaman Notifikasi dan Buat Pertanyaan), aplikasi ini membuat satu komponen pembungkus pintar bernama `<ProtectedRoute>`. 

```javascript
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  // Jika tidak punya token, tendang ke halaman login
  if (!token) return <Navigate to="/login" replace />;
  // Jika punya token, izinkan masuk ke halaman yang dituju
  return children;
}

// Rute ini aman karena sudah dibungkus
<Route path="/tanya" element={<ProtectedRoute><AskPage /></ProtectedRoute>} />
<Route path="/notifikasi" element={<ProtectedRoute><NotifPage /></ProtectedRoute>} />
```

---

## 10. Frontend React: Optimasi Performa dengan `useCallback`
📍 **File:** `src/pages/ForumPage.jsx`

Di React, memanggil fungsi secara sembarangan di dalam `useEffect` bisa membuat aplikasi *crash* karena *Infinite Loop* (me-render ulang halaman ribuan kali per detik). Untuk mencegah hal ini, fungsi pengambilan data forum dibungkus dengan metode yang aman menggunakan `useCallback`.

```javascript
// Fungsi ini hanya akan dibuat ulang JIKA nilai filter (kategori, status, sort) berubah
const fetchPosts = useCallback(async () => {
    // ... proses ambil data dari server ...
}, [activeCategory, activeStatus, activeSort, searchParams]); 

// Fungsi akan dijalankan tanpa menyebabkan Infinite Loop
useEffect(() => { 
   fetchPosts(); 
}, [fetchPosts]);
```
