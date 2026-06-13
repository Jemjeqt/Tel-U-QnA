# Dokumentasi Lengkap Sistem Tel-U QnA
**Forum Diskusi dan Tanya Jawab Mahasiswa berbasis MongoDB + React**

---

## Daftar Isi

1. [Deskripsi Sistem](#1-deskripsi-sistem)
2. [Fitur Utama](#2-fitur-utama)
3. [Tech Stack](#3-tech-stack)
4. [Arsitektur Database MongoDB](#4-arsitektur-database-mongodb)
5. [Keputusan Desain: Embed vs Reference](#5-keputusan-desain-embed-vs-reference)
6. [Relasi Antar Collection](#6-relasi-antar-collection)
7. [Alur Sistem Q&A](#7-alur-sistem-qa)
8. [Query Penting](#8-query-penting)
9. [Indexing Strategy](#9-indexing-strategy)
10. [Struktur Halaman Web App](#10-struktur-halaman-web-app)
11. [Detail Setiap Halaman](#11-detail-setiap-halaman)
12. [Komponen Global](#12-komponen-global)
13. [Alur Navigasi Lengkap](#13-alur-navigasi-lengkap)
14. [Desain Visual](#14-desain-visual)
15. [Integrasi Frontend dengan MongoDB](#15-integrasi-frontend-dengan-mongodb)
16. [Struktur Folder Proyek](#16-struktur-folder-proyek)
17. [Roadmap Pengembangan](#17-roadmap-pengembangan)
18. [Kelebihan MongoDB untuk Sistem Ini](#18-kelebihan-mongodb-untuk-sistem-ini)

---

## 1. Deskripsi Sistem

Tel-U QnA adalah platform forum diskusi dan tanya jawab berbasis web untuk mahasiswa. Pengguna dapat mengajukan pertanyaan seputar mata kuliah, menjawab pertanyaan sesama mahasiswa, memberikan upvote, membalas komentar secara bersarang (nested reply), serta mendapatkan notifikasi ketika ada aktivitas terkait pertanyaan mereka.

Sistem ini dibangun menggunakan **MongoDB** sebagai database utama karena sifat data yang semi-terstruktur, hierarkis (nested comments), dan fleksibel cocok dengan model dokumen NoSQL. Di sisi frontend, sistem menggunakan **React** sebagai Single Page Application (SPA) dengan tampilan Academic/Formal.

---

## 2. Fitur Utama

- Post pertanyaan dengan kategori dan tag
- Jawab pertanyaan (top-level comment)
- Nested reply antar komentar via `parentId`
- Upvote pertanyaan dan jawaban
- Tandai jawaban sebagai accepted (mark as solved)
- Notifikasi otomatis ke semua user saat ada aktivitas baru (3 tipe)
- Filter pertanyaan berdasarkan kategori dan tag
- Full-text search pada judul dan isi pertanyaan
- Unique view tracking per user
- Akses publik (guest bisa browsing tanpa login)

---

## 3. Tech Stack

| Komponen | Teknologi |
|---|---|
| Database | MongoDB |
| Model data | Document-oriented (BSON) |
| Relasi | Reference (ObjectId) + Embed |
| Query kompleks | Aggregation Pipeline |
| Frontend | React + Vite |
| Rendering | Single Page Application (SPA) |
| Backend | Node.js + Express |
| State Management | React useState / useReducer |

---

## 4. Arsitektur Database MongoDB

Sistem menggunakan **6 collection utama**:

### 4.1 `users`

Menyimpan data akun mahasiswa.

```json
{
  "_id": ObjectId("user001"),
  "username": "andi_r",
  "email": "andi@mahasiswa.ac.id",
  "password": "hashed_string",
  "createdAt": ISODate("2025-01-10"),
  "updatedAt": ISODate("2025-01-10")
}
```

### 4.2 `categories`

Menyimpan kategori forum, umumnya per mata kuliah.

```json
{
  "_id": ObjectId("cat001"),
  "name": "Basis Data",
  "slug": "basis-data",
  "description": "Diskusi seputar mata kuliah basis data"
}
```

### 4.3 `tags`

Label topik yang bisa dipakai lintas kategori. Menyimpan counter jumlah post untuk efisiensi query.

```json
{
  "_id": ObjectId("tag001"),
  "name": "MongoDB",
  "postCount": 42
}
```

### 4.4 `posts`

Collection inti. Menyimpan pertanyaan dengan referensi ke `users`, `categories`, dan `tags`. Upvote di-embed karena selalu dibaca bersama dokumen post.

```json
{
  "_id": ObjectId("post001"),
  "title": "Kapan pakai embed vs reference di MongoDB?",
  "body": "Saya bingung menentukan kapan harus embed document...",
  "authorId": ObjectId("user001"),
  "categoryId": ObjectId("cat001"),
  "tags": [ObjectId("tag001"), ObjectId("tag002")],
  "upvotes": [
    { "userId": ObjectId("user002"), "createdAt": ISODate("2025-03-01") }
  ],
  "viewers": [ObjectId("user001"), ObjectId("user002")],
  "viewCount": 2,
  "isSolved": true,
  "acceptedCommentId": ObjectId("comment001"),
  "isDeleted": false,
  "createdAt": ISODate("2025-02-28"),
  "updatedAt": ISODate("2025-02-28")
}
```

> `acceptedCommentId` menyimpan referensi ke jawaban yang diterima, sehingga operasi "Mark as Solved" cukup satu `updateOne` pada collection `posts` — menjaga atomicity tanpa membutuhkan transaksi terpisah.
>
> `isDeleted` digunakan untuk **soft delete**: data tidak dihapus secara fisik, hanya ditandai. Semua query harus selalu menyertakan filter `{ isDeleted: false }`.
>
> `viewers` adalah array embedded berisi ObjectId user unik yang telah membuka post. `viewCount` hanya di-increment jika userId belum ada di array `viewers`, memastikan 1 user = 1 view.

### 4.5 `comments`

Menyimpan jawaban dan reply. Nested reply diimplementasikan via field `parentId` — jika `null` berarti top-level answer, jika diisi berarti reply terhadap comment lain.

```json
{
  "_id": ObjectId("comment001"),
  "postId": ObjectId("post001"),
  "authorId": ObjectId("user002"),
  "body": "Gunakan embed jika data selalu dibaca bersama...",
  "parentId": null,
  "upvotes": [
    { "userId": ObjectId("user003"), "createdAt": ISODate("2025-03-01") }
  ],
  "isAccepted": true,
  "isDeleted": false,
  "createdAt": ISODate("2025-03-01"),
  "updatedAt": ISODate("2025-03-01")
}
```

### 4.6 `notifications`

Menyimpan notifikasi per user. `type` menentukan jenis notifikasi, `postId` menunjuk ke pertanyaan terkait.

```json
{
  "_id": ObjectId("notif001"),
  "userId": ObjectId("user001"),
  "type": "answer_accepted",
  "postId": ObjectId("post001"),
  "message": "Jawaban Anda dipilih sebagai jawaban terbaik!",
  "isRead": false,
  "createdAt": ISODate("2025-03-02")
}
```

> Setiap notifikasi memiliki `postId` yang langsung mereferensi pertanyaan terkait. Saat user klik notifikasi, aplikasi langsung navigasi ke halaman detail pertanyaan tersebut.


---

## 5. Keputusan Desain: Embed vs Reference

| Data | Strategi | Alasan |
|---|---|---|
| `upvotes` di posts | **Embed** | Selalu dibaca bersama post, jumlah terbatas |
| `upvotes` di comments | **Embed** | Sama seperti di posts |
| `viewers` di posts | **Embed** | Hanya perlu cek "apakah user sudah view", tidak perlu query terpisah |
| `authorId` di posts | **Reference** | Data user bisa berubah, tidak perlu duplikasi |
| `categoryId` di posts | **Reference** | Category adalah entitas mandiri |
| `tags[]` di posts | **Reference** | Perlu query "semua post dengan tag X" |
| `parentId` di comments | **Reference (self)** | Nested reply ke sesama collection comments |
| `acceptedCommentId` di posts | **Reference** | Menjaga atomicity Mark as Solved dalam satu operasi |
| `postId` di notifications | **Reference** | Setiap notifikasi menunjuk ke pertanyaan terkait |

---

## 6. Relasi Antar Collection

```
users ──────────────── posts (authorId)
users ──────────────── comments (authorId)
users ──────────────── notifications (userId)
categories ─────────── posts (categoryId)
tags ───────────────── posts (tags[])
posts ──────────────── comments (postId)            [1:N]
posts ──────────────── comments (acceptedCommentId) [0:1]
comments ───────────── comments (parentId)          [self-reference, nested]
posts/comments ──────── notifications (postId)
```

---

## 7. Alur Sistem Q&A

### 7.1 User Mengajukan Pertanyaan

1. User mengisi judul, body, pilih category, tambah tags
2. Dokumen baru diinsert ke collection `posts`
3. `postCount` di tiap tag yang dipilih di-increment secara atomic

### 7.2 User Menjawab Pertanyaan

1. User menulis jawaban pada halaman post
2. Dokumen diinsert ke `comments` dengan `parentId: null` (top-level)
3. Notifikasi dikirim ke pemilik post (`type: "new_answer"`)

### 7.3 Nested Reply

1. User membalas sebuah komentar
2. Dokumen diinsert ke `comments` dengan `parentId` diisi ObjectId komentar yang dibalas
3. Notifikasi dikirim ke penulis komentar induk (`type: "new_reply"`)

### 7.4 Mark as Solved

1. Pemilik post memilih jawaban terbaik
2. **Satu operasi update** dijalankan pada collection `posts`:

```javascript
db.posts.updateOne(
  { _id: ObjectId("post001"), authorId: currentUserId },
  { $set: { isSolved: true, acceptedCommentId: ObjectId("comment001"), updatedAt: new Date() } }
)
```

3. Satu operasi update terpisah pada `comments` untuk menandai `isAccepted: true` — ini hanya flag tampilan, bukan penentu utama jawaban terpilih (sumber kebenaran ada di `posts.acceptedCommentId`)
4. Notifikasi dikirim ke penjawab (`type: "answer_accepted"`, `refId: commentId`, `refCollection: "comments"`)

> **Catatan atomicity**: Dengan menyimpan `acceptedCommentId` di dokumen `posts`, operasi utama hanya satu write. Jika update flag `isAccepted` di `comments` gagal, sistem tetap konsisten karena `posts.acceptedCommentId` sudah benar sebagai sumber kebenaran.

---

## 8. Query Penting

### 8.1 Ambil semua post beserta detail author dan tags (Aggregation)

```javascript
db.posts.aggregate([
  { $match: { isDeleted: false, isSolved: false } },
  {
    $lookup: {
      from: "users",
      localField: "authorId",
      foreignField: "_id",
      as: "author"
    }
  },
  {
    $lookup: {
      from: "tags",
      localField: "tags",
      foreignField: "_id",
      as: "tagDetails"
    }
  },
  {
    $addFields: {
      upvoteCount: { $size: "$upvotes" }
    }
  },
  { $sort: { upvoteCount: -1, createdAt: -1 } }
])
```

### 8.2 Ambil comments berdasarkan postId, terurut hierarkis

```javascript
db.comments.find(
  { postId: ObjectId("post001"), isDeleted: false },
  { sort: { createdAt: 1 } }
)
```

> Hierarki nested reply direkonstruksi di sisi aplikasi menggunakan `parentId`.

### 8.3 Trending posts berdasarkan jumlah upvote

```javascript
db.posts.aggregate([
  { $match: { isDeleted: false } },
  {
    $addFields: {
      upvoteCount: { $size: "$upvotes" }
    }
  },
  { $sort: { upvoteCount: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "authorId",
      foreignField: "_id",
      as: "author"
    }
  }
])
```

### 8.4 Filter post berdasarkan tag tertentu

```javascript
db.posts.find(
  { tags: ObjectId("tag001"), isDeleted: false }
).sort({ createdAt: -1 })
```

### 8.5 Notifikasi belum dibaca milik user tertentu

```javascript
db.notifications.find(
  { userId: ObjectId("user001"), isRead: false }
).sort({ createdAt: -1 })
```

### 8.6 Insert pertanyaan baru

```javascript
db.posts.insertOne({
  title: "Apa itu indexing di MongoDB?",
  body: "Saya bingung kapan harus pakai index...",
  authorId: ObjectId("user001"),
  categoryId: ObjectId("cat001"),
  tags: [ObjectId("tag001")],
  upvotes: [],
  viewers: [],
  viewCount: 0,
  isSolved: false,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 8.7 Mark as Solved (dua operasi terpisah)

```javascript
// Operasi utama: satu write pada posts (atomic, sumber kebenaran)
db.posts.updateOne(
  { _id: ObjectId("post001"), authorId: ObjectId("user001") },
  { $set: { isSolved: true, acceptedCommentId: ObjectId("comment001"), updatedAt: new Date() } }
)

// Operasi sekunder: update flag tampilan pada comment
db.comments.updateOne(
  { _id: ObjectId("comment001") },
  { $set: { isAccepted: true, updatedAt: new Date() } }
)
```

### 8.8 Pencarian post berdasarkan kata kunci (Text Search)

```javascript
// Memerlukan text index pada title dan body
db.posts.find(
  { $text: { $search: "MongoDB indexing" }, isDeleted: false },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

### 8.9 Cursor-based pagination

```javascript
// Halaman pertama
db.posts.find({ isDeleted: false, isSolved: false })
  .sort({ _id: -1 })
  .limit(20)

// Halaman berikutnya — gunakan _id dokumen terakhir dari halaman sebelumnya
db.posts.find({ isDeleted: false, isSolved: false, _id: { $lt: ObjectId("lastSeenId") } })
  .sort({ _id: -1 })
  .limit(20)
```

> Cursor-based pagination lebih efisien dari offset (`$skip`) karena tetap performan meski data bertambah jutaan dokumen.

### 8.10 Unique view tracking

```javascript
// Jika user belum pernah melihat post ini, tambahkan ke viewers
db.posts.updateOne(
  { _id: ObjectId("post001"), viewers: { $ne: ObjectId("user001") } },
  { $push: { viewers: ObjectId("user001") }, $inc: { viewCount: 1 } }
)
```

---

## 9. Indexing Strategy

```javascript
// Index pada posts
db.posts.createIndex({ authorId: 1 })
db.posts.createIndex({ categoryId: 1 })
db.posts.createIndex({ tags: 1 })
db.posts.createIndex({ createdAt: -1 })
db.posts.createIndex({ isSolved: 1 })
db.posts.createIndex({ isDeleted: 1 })

// Compound index untuk query umum
db.posts.createIndex({ categoryId: 1, createdAt: -1 })       // posts per kategori, terbaru
db.posts.createIndex({ isSolved: 1, createdAt: -1 })         // filter status + urutan waktu
db.posts.createIndex({ isDeleted: 1, isSolved: 1, _id: -1 }) // pagination utama

// Text index untuk fitur pencarian kata kunci
db.posts.createIndex({ title: "text", body: "text" })

// Index pada comments
db.comments.createIndex({ postId: 1 })
db.comments.createIndex({ parentId: 1 })
db.comments.createIndex({ postId: 1, isDeleted: 1 })         // filter soft delete saat fetch comments

// Index pada notifications
db.notifications.createIndex({ userId: 1, isRead: 1 })
```

---

## 10. Struktur Halaman Web App

Aplikasi terdiri dari **5 halaman utama** yang saling terhubung melalui navigasi client-side:

```
Tel-U QnA Web App
│
├── /login              → Halaman Login
├── /register           → Halaman Registrasi
├── /forum              → Beranda Forum (Feed Pertanyaan)
├── /forum/:postId      → Detail Pertanyaan + Komentar
├── /tanya              → Form Ajukan Pertanyaan
└── /notifikasi         → Pusat Notifikasi
```

---

## 11. Detail Setiap Halaman

### 11.1 Halaman Autentikasi (`/login` & `/register`)

Halaman pertama yang dilihat pengguna. Dua mode yang bisa di-toggle tanpa pindah halaman.

**Komponen:**
- Logo dan identitas platform
- Form login (email + password)
- Form registrasi (nama, email, password)
- Toggle antar mode login dan register
- Validasi input sisi klien

**Alur:**
1. Pengguna membuka aplikasi → diarahkan ke `/forum` (bisa browsing tanpa login)
2. Ingin bertanya/menjawab → klik "Masuk" atau "Daftar" di navbar
3. Berhasil login/register → redirect ke `/forum`

---

### 11.2 Halaman Forum / Beranda (`/forum`)

Halaman utama forum. Bisa diakses tanpa login (guest mode). Layout 3 kolom: Sidebar Kiri | Feed Utama | Panel Kanan.

**Sidebar Kiri:**
- Menu navigasi (Beranda, Belum Terjawab, Terjawab, Ajukan Pertanyaan)
- Daftar kategori mata kuliah beserta jumlah post
- Cloud tag populer

**Feed Utama:**
- Header dengan judul feed dan tombol filter (Terbaru, Trending, Belum Dijawab)
- Kartu pertanyaan: kategori, judul, preview isi, tag, upvote, jawaban, views
- Border hijau untuk pertanyaan yang sudah terjawab

**Panel Kanan:**
- Top 4 pertanyaan trending (by upvote)
- Statistik forum (total pertanyaan, jawaban, terjawab, mahasiswa)

---

### 11.3 Halaman Detail Pertanyaan (`/forum/:postId`)

Menampilkan pertanyaan penuh beserta semua jawaban dan nested reply.

**Blok Pertanyaan:**
- Judul, isi, metadata (kategori, author, tanggal, views), tags
- Tombol: Upvote (toggle), jumlah jawaban, Bagikan
- Badge "Terjawab" jika sudah solved

**Blok Jawaban:**
- Jawaban terbaik tampil paling atas dengan border hijau dan badge "Jawaban Terbaik"
- Setiap jawaban: avatar, nama author, waktu, isi, upvote, tombol Balas
- Nested reply tampil sebagai sub-card indented ke kanan

**Form Tulis Jawaban:**
- Textarea + tombol "Kirim Jawaban"
- Validasi tidak boleh kosong

---

### 11.4 Halaman Ajukan Pertanyaan (`/tanya`)

Form untuk membuat pertanyaan baru dengan field:
- **Judul Pertanyaan** — input teks
- **Detail Pertanyaan** — textarea
- **Kategori** — dropdown mata kuliah
- **Tags** — input dinamis (Enter untuk tambah, × untuk hapus)

**Alur setelah submit:**
1. Post baru diinsert ke `posts`
2. `postCount` di tiap tag di-increment
3. Notifikasi dikirim ke semua user lain
4. Redirect ke `/forum`

---

### 11.5 Halaman Notifikasi (`/notifikasi`)

Pusat notifikasi dengan 3 tipe notifikasi:

| Tipe | Keterangan |
|---|---|
| `new_answer` | Ada yang menjawab pertanyaan pengguna |
| `answer_accepted` | Jawaban pengguna dipilih sebagai terbaik |
| `new_reply` | Ada yang membalas komentar pengguna |

**Fitur:**
- Notifikasi belum dibaca: border biru + dot biru
- Klik notifikasi → tandai dibaca
- Tombol "Tandai semua dibaca"
- Badge unread count di ikon navbar

---

## 12. Komponen Global

### 12.1 Navbar (Persistent, mendukung guest mode)

| Elemen | Fungsi |
|---|---|
| Logo Tel-U QnA | Klik → kembali ke `/forum` |
| Search bar | Cari pertanyaan berdasarkan kata kunci |
| Tombol `+ Tanya` | Navigasi ke `/tanya` (redirect login jika guest) |
| Ikon lonceng 🔔 | Navigasi ke `/notifikasi`, tampilkan badge unread (hanya jika login) |
| Avatar + Username | Inisial username pengguna aktif (hanya jika login) |
| Tombol Masuk/Daftar | Ditampilkan jika belum login (guest mode) |

### 12.2 Kartu Post (Reusable Component)

```
PostCard props:
  - id         : string
  - title      : string
  - body       : string  (preview 2 baris)
  - category   : string
  - tags[]     : string[]
  - upvotes    : number
  - answers    : number
  - views      : number
  - solved     : boolean
  - author     : string
  - time       : string
```

---

## 13. Alur Navigasi Lengkap

```
[Buka App]
    │
    ▼
[Forum / Beranda] ← bisa diakses tanpa login (guest mode)
    ├── Klik kartu pertanyaan ──────────► [Detail Pertanyaan]
    │                                           ├── Upvote (toggle, perlu login)
    │                                           ├── Tulis & kirim jawaban (perlu login)
    │                                           ├── Nested reply (perlu login)
    │                                           └── Mark as Solved (owner)
    │
    ├── Klik "+ Tanya" ─────────────────► [Login] → [Form Ajukan Pertanyaan]
    │                                           └── Submit → kembali ke Forum
    │
    ├── Klik 🔔 ────────────────────────► [Notifikasi] (perlu login)
    │                                           └── Klik notif → navigasi ke post
    │
    ├── Filter kategori (sidebar) ──────► Feed difilter by category
    └── Sorting (Terbaru/Trending) ─────► Feed diurutkan ulang
```

---

## 14. Desain Visual

### 14.1 Prinsip Desain

Tampilan **Academic / Formal** — bersih, profesional, cocok untuk konteks perkuliahan.

### 14.2 Palet Warna

| Elemen | Warna |
|---|---|
| Primary / CTA | `#185FA5` |
| Primary Dark (hover) | `#0C447C` |
| Solved / Accepted | `#1D9E75` |
| Unread / Danger | `#E24B4A` |
| Background kartu | `var(--color-background-primary)` |
| Background halaman | `var(--color-background-tertiary)` |

### 14.3 Status Visual

| Status | Representasi |
|---|---|
| Post terjawab | Border kiri hijau 3px + badge "✅ Terjawab" |
| Jawaban terbaik | Border kiri hijau 3px + badge "✅ Jawaban Terbaik" |
| Notif belum dibaca | Border kiri biru 3px + dot biru |
| Upvote aktif | Background biru muda + border biru |

---

## 15. Integrasi Frontend dengan MongoDB

Setiap aksi di frontend berkorespondensi langsung dengan operasi MongoDB:

| Aksi User | Operasi MongoDB |
|---|---|
| Login | `db.users.findOne({ email })` → verifikasi passwordHash |
| Lihat forum | `db.posts.find({ isDeleted: false }).sort({ createdAt: -1 })` |
| Filter kategori | `db.posts.find({ categoryId, isDeleted: false })` |
| Filter tag | `db.posts.find({ tags: ObjectId("tagId"), isDeleted: false })` |
| Buka detail post | `db.posts.findOne({ _id })` + `db.comments.find({ postId })` |
| Upvote post | `db.posts.updateOne({ _id }, { $push/$pull: { upvotes: ... } })` |
| Kirim jawaban | `db.comments.insertOne({ postId, parentId: null, ... })` |
| Reply komentar | `db.comments.insertOne({ postId, parentId: commentId, ... })` |
| Mark as Solved | `db.posts.updateOne(...)` + `db.comments.updateOne(...)` |
| Lihat notifikasi | `db.notifications.find({ userId, isRead: false })` |
| Submit pertanyaan | `db.posts.insertOne(...)` + increment `tags.postCount` |
| Cari kata kunci | `db.posts.find({ $text: { $search: "..." } })` |

---

## 16. Struktur Folder Proyek

```
teluqna/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PostCard.jsx
│   │   ├── CommentCard.jsx
│   │   ├── NotifItem.jsx
│   │   └── TagInput.jsx
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   ├── ForumPage.jsx
│   │   ├── DetailPage.jsx
│   │   ├── AskPage.jsx
│   │   └── NotifPage.jsx
│   ├── services/
│   │   └── api.js               ← axios instance + base URL
│   ├── utils/
│   │   └── formatDate.js
│   ├── App.jsx
│   └── main.jsx
├── server/                       ← Backend (Node.js + Express)
│   ├── routes/
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── users.js
│   │   └── notifications.js
│   ├── models/
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── User.js
│   │   ├── Notification.js
│   │   ├── Tag.js
│   │   └── Category.js
│   ├── middleware/
│   │   └── auth.js
│   └── index.js
├── package.json
└── README.md
```

---

## 17. Cakupan Fitur Sistem (Selesai)

Seluruh fitur inti yang dirancang untuk platform ini telah diimplementasikan sepenuhnya:
- Autentikasi (Login & Register)
- Akses publik forum (guest mode)
- Feed pertanyaan dengan filter & sorting
- Detail pertanyaan + jawaban + nested reply
- Upvote pertanyaan dan jawaban
- Mark as Solved (Jawaban Terbaik)
- Hapus Pertanyaan & Komentar (Soft Delete untuk Integritas Data)
- Form ajukan pertanyaan dengan tag dinamis
- Sistem notifikasi (3 tipe)
- Pencarian kata kunci (Full-text search)
- Unique view tracking per user
- Statistik forum
- Trending posts

---

## 18. Kelebihan MongoDB untuk Sistem Ini

- **Nested comments** diimplementasikan secara natural dengan `parentId` tanpa join rekursif seperti di SQL
- **Upvotes sebagai embedded array** menghindari collection terpisah dan mempercepat read
- **Viewers sebagai embedded array** memungkinkan unique view tracking tanpa collection tambahan
- **Aggregation pipeline** menggantikan multiple JOIN dalam satu query berantai
- **Schema fleksibel** memungkinkan penambahan field baru (misal: `attachment`, `bounty`) tanpa migrasi database
- **`tags[]` sebagai array ObjectId** di posts memudahkan filter multi-tag dalam satu query
- **`acceptedCommentId` di posts** menjaga atomicity Mark as Solved dalam satu operasi write
- **`isDeleted` + `updatedAt`** memungkinkan soft delete dan audit trail tanpa kehilangan data
- **`postId` di notifications** membuat setiap notifikasi langsung mereferensi pertanyaan terkait — relasi sederhana dan jelas
- **Text index** memastikan fitur pencarian kata kunci tetap performan di skala besar

---

*Dokumen ini merupakan dokumentasi lengkap sistem Tel-U QnA — mencakup arsitektur database MongoDB dan struktur web application berbasis React. Dibuat sebagai bagian dari tugas besar mata kuliah Basis Data Lanjutan.*
