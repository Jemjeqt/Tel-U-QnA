   # Tel-U QnA

**Tel-U QnA** adalah platform forum diskusi dan tanya jawab interaktif berbasis web, yang dirancang khusus untuk mewadahi kebutuhan akademis mahasiswa. Melalui Tel-U QnA, mahasiswa dapat bertanya, berdiskusi, memberikan jawaban, hingga melakukan *upvote* selayaknya platform tanya-jawab profesional, namun dengan sentuhan desain yang lebih bernuansa *academic* dan terstruktur.

Dibangun menggunakan modern *tech stack* (MERN / MongoDB, Express, React, Node.js) dengan penerapan relasi database tingkat lanjut menggunakan *Aggregation Pipeline* di MongoDB.

---

## Fitur Utama

- **Sistem Tanya & Jawab (Q&A)**: Buat pertanyaan dengan kategori mata kuliah dan *tags* yang spesifik.
- **Nested Replies**: Komentar bersarang yang rapi (mirip Reddit/StackOverflow).
- **Sistem Reputasi (Upvote)**: Berikan *upvote* pada pertanyaan atau jawaban yang bermanfaat.
- **Mark as Solved**: Penanya dapat menandai satu jawaban sebagai "Jawaban Terbaik" (Solved).
- **Notifikasi Real-time**: Dapatkan pemberitahuan saat ada yang menjawab pertanyaanmu atau jawabanmu dipilih sebagai yang terbaik.
- **Trending & Terbaru**: Temukan diskusi terhangat berdasarkan jumlah *upvote* atau *timeline* terbaru.
- **Pencarian Cerdas**: Cari topik spesifik melalui fitur pencarian (*Full-text search* MongoDB).

---

## Teknologi yang Digunakan

Aplikasi ini menggunakan arsitektur *Client-Server* terpisah (Single Page Application):

### Frontend
- **React.js** (Vite)
- **React Router DOM** (Client-side routing)
- **Vanilla CSS** (Custom Design System tanpa framework)
- **Axios** (HTTP Client)

### Backend
- **Node.js** & **Express.js** (REST API)
- **MongoDB** & **Mongoose** (Database & ODM)
- **JWT (JSON Web Token)** (Autentikasi User)
- **Bcrypt.js** (Keamanan Password)

---

## Cara Instalasi & Menjalankan (Local Development)

### Prasyarat
Pastikan di komputer Anda sudah terpasang:
- [Node.js](https://nodejs.org/) (Versi 18+ disarankan)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (Berjalan di `localhost:27017` secara default)

### Langkah-langkah

1. **Clone repositori ini**
   ```bash
   git clone https://github.com/username/kampus-ask.git
   cd kampus-ask
   ```

2. **Instalasi Dependencies**
   Jalankan perintah ini di *root directory* untuk menginstal seluruh package frontend dan backend (karena `package.json` menyatukan dependensi server dan client):
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file bernama `.env` di *root directory*, lalu isi dengan:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/teluqna
   JWT_SECRET=rahasia_super_aman_untuk_telu_qna_123
   ```

4. **Isi Database dengan Data Awal (Seeding)**
   Jalankan perintah ini untuk membersihkan database (jika ada) dan mengisi data *dummy* awal (users, posts, categories, comments):
   ```bash
   npm run seed
   ```
   *(Data akun uji coba akan tercetak di terminal setelah proses selesai, contoh: andi@mahasiswa.ac.id / password123)*

5. **Jalankan Aplikasi**
   Gunakan perintah `dev` untuk menyalakan Backend (Port 5000) dan Frontend (Port 5173) secara bersamaan:
   ```bash
   npm run dev
   ```

6. Buka browser dan akses: **http://localhost:5173**

---

## Struktur Folder Utama

```text
kampus-ask/
├── server/             # Kode Backend (Express API)
│   ├── index.js        # Entry point server
│   ├── middleware/     # Auth JWT verifier
│   ├── models/         # Skema Mongoose (Post, User, Comment, dll)
│   └── routes/         # Endpoint API (/api/posts, /api/auth, dll)
├── src/                # Kode Frontend (React App)
│   ├── App.jsx         # Konfigurasi Routes Frontend
│   ├── components/     # Reusable UI (Navbar, PostCard, Sidebar)
│   ├── pages/          # Halaman utama (ForumPage, DetailPage, Login)
│   ├── services/       # Integrasi Axios API
│   ├── utils/          # Fungsi formatter/helper
│   └── index.css       # Global styles & variabel warna
└── package.json        # Script project & dependensi
```

---

## Catatan Tambahan
Proyek ini dibuat untuk tujuan edukasi dan demonstrasi penerapan *Relational Data Model* vs *Embedded Document* serta *Aggregation Pipeline* pada ekosistem MongoDB. Selengkapnya mengenai rancangan sistem dapat dilihat pada dokumen internal aplikasi.

***
