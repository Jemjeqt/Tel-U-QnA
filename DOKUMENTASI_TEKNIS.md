# Dokumentasi Teknis: Tel-U QnA

---

## 1. Sistem Otentikasi Berbasis JWT (JSON Web Token)

Aplikasi ini pakai JWT buat login. Konsepnya kayak **"KTP Digital"**. Setelah aku berhasil login, server bakal ngasih token KTP ini. Tiap kali mau ngakses fitur penting (kayak bikin post), KTP ini wajib dibawa. Enaknya, server ga perlu capek nginget siapa yang lagi login, karena semua identitasku udah nempel di dalam token itu.

### A. Pas Bikin Token (Login & Register)
📍 **File:** `server/routes/auth.js`

Saat login sukses, server langsung ngebungkus dataku jadi token dan ngirim ke browser.
```javascript
// Bikin Token JWT, umurnya 7 hari
const token = jwt.sign(
  { id: user._id, username: user.username },  // Data yang diselipin ke KTP
  process.env.JWT_SECRET,                      // Kunci gembok rahasia
  { expiresIn: '7d' }                         // Masa berlaku
);

// Kirim ke browser
res.json({ 
  token, 
  user: { id: user._id, username: user.username, email: user.email } 
});
```

### B. Pas Pengecekan Token (Middleware Keamanan)
📍 **File:** `server/middleware/auth.js`

Tiap kali ada request masuk (misal mau nge-post), ada file "satpam" yang ngecek tokennya asli atau palsu.
```javascript
export default function auth(req, res, next) {
  // Ambil token dari header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  try {
    // Cek keaslian token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Kalo asli, datanya disimpen biar bisa dipake di proses selanjutnya
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}
```

---

## 2. Enkripsi Password (Bcrypt)
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

## 3. Fitur Trending (Sorting Javascript)
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

## 4. Statistik Forum (Beranda)
📍 **File:** `server/routes/posts.js`

Di halaman depan kan ada angka total diskusi, komentar, dsb. Itu cara ngitungnya langsung nembak ke database pakai perintah bawaan `countDocuments()`. Cepat dan akurat.

```javascript
const totalPosts = await Post.countDocuments({ isDeleted: false });
const totalComments = await Comment.countDocuments({ isDeleted: false });
const totalSolved = await Post.countDocuments({ isDeleted: false, isSolved: true });
const totalUsers = await User.countDocuments();
```

---

## 5. Fitur View Count Anti-Spam
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

## 6. Relasi Data di MongoDB (Populate)
📍 **File:** Backend Routes

Di tabel `Post`, aku aslinya cuma nyimpen ID si pembuat (`authorId`). Tapi biar pas dimunculin di web bisa langsung keluar nama `username`-nya tanpa harus bikin query nyari user lagi, aku pakai fitur sakti bernama **`.populate()`**.

```javascript
const post = await Post.findById(id)
  .populate('authorId', 'username')       // Tolong gabungin data username dari koleksi User dong!
  .populate('categoryId', 'name slug');   // Gabungin juga nama kategorinya
```

---

## 7. Trik Frontend 1: Axios Interceptors (Pencegat API)
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
      window.location.href = '/login'; // Tendang ke halaman login
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Trik Frontend 2: Protected Route (Penjaga Halaman)
📍 **File:** `src/App.jsx`

Daripada aku nulis kode ngecek login di setiap komponen halaman, aku mending bikin satu bungkus komponen pelindung bernama `<ProtectedRoute>`. Halaman apapun yang dibungkus pakai ini ga akan bisa dibuka kalau belum login.

```javascript
// Bikin komponen pelindung
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  // Ga punya token? Bye, balik ke login!
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Cara pakainya di rute utama (App.jsx)
<Route path="/tanya" element={<ProtectedRoute><AskPage /></ProtectedRoute>} />
```

---

## 9. Penjelasan Arsitektur Database (Analogi Restoran)

Dosen sering nanya: *"Kok aplikasi databasenya jalan padahal aplikasi Compass-nya ga dibuka?"* 
Jawabannya gampang, pakai analogi restoran:
1. **Mesin MongoDB (`mongod.exe`)** = Koki di dalam dapur. Mesin ini aslinya udah nyala otomatis di *background* Windows tiap laptop nyala.
2. **Aplikasi Backend (Node.js)** = Pelayan. Dia langsung konek ke dapur (port 27017) lewat library Mongoose.
3. **MongoDB Compass** = Cuma **Layar CCTV**. Fungsinya cuma biar kita bisa ngintip data secara visual.

Karena si Pelayan udah bisa langsung ngomong sama si Koki, webnya tetap bisa jalan tanpa harus buka CCTV (Compass) sama sekali!

---

## 10. Panduan Baca Data Pakai Terminal (mongosh)

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
