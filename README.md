# Tel-U QnA

**Tel-U QnA** adalah platform forum tanya jawab berbasis web untuk mahasiswa Telkom University. Mahasiswa dapat bertanya, berdiskusi, memberikan jawaban, upvote, dan memilih jawaban terbaik.

---

## Fitur Utama

- **Forum Q&A** — Buat pertanyaan dengan kategori dan tag
- **Nested Comments** — Balas komentar bersarang (Reddit/StackOverflow style)
- **Upvote System** — Beri upvote pada pertanyaan atau jawaban
- **Pilih Jawaban Terbaik** — Pemilik pertanyaan bisa tandai solved
- **Notifikasi** — Pemberitahuan saat ada jawaban/balasan baru
- **Dashboard Admin** — Moderasi user, post, komentar, kategori, dan tag
- **Full-Text Search** — Pencarian cepat dengan MongoDB text index
- **Soft Delete** — Hapus aman tanpa kehilangan data

---

## Teknologi

### Frontend

- React 19 + Vite
- React Router v7
- Tailwind CSS v4
- Axios

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- JWT (autentikasi)
- Bcryptjs (enkripsi password)

### Database

- MongoDB (NoSQL)
- Text Index untuk pencarian
- Soft delete pattern

---

## Cara Menjalankan

### Prasyarat

- Node.js 18+
- MongoDB (local atau Atlas)

### Instalasi

```bash
# Clone & masuk folder
cd telu-qna

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan MongoDB URI dan JWT_SECRET

# Seed database
npm run seed

# Jalankan aplikasi
npm run dev
```

### Akun Demo

| Username | Email                                | Password    | Role  |
| -------- | ------------------------------------ | ----------- | ----- |
| admin    | admin@student.telkomuniversity.ac.id | admin123    | Admin |
| andi     | andi@student.telkomuniversity.ac.id  | password123 | User  |

---

## Struktur Folder

```
telu-qna/
├── server/
│   ├── index.js          # Entry point (port 5000)
│   ├── seed.js           # Database seeder
│   ├── create-admin.js   # Script buat admin via CLI
│   ├── middleware/       # auth.js, admin.js
│   ├── models/          # User, Post, Comment, Notification, Category, Tag
│   └── routes/          # auth, posts, comments, notifications, admin
├── src/
│   ├── App.jsx          # Router setup
│   ├── components/      # Navbar, PostCard, CommentCard, Sidebar
│   ├── pages/           # ForumPage, DetailPage, AskPage, NotifPage
│   │   └── admin/       # AdminDashboard, UserManagement, dll
│   ├── services/        # api.js (Axios instance)
│   └── utils/           # formatDate, swal
└── package.json
```

---

## API Endpoints

### Auth

- `POST /api/auth/register` — Registrasi
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Posts

- `GET /api/posts` — List pertanyaan
- `GET /api/posts/trending` — Post trending
- `POST /api/posts` — Buat pertanyaan
- `PUT /api/posts/:id/upvote` — Toggle upvote
- `PUT /api/posts/:id/solve` — Pilih jawaban terbaik

### Comments

- `GET /api/posts/:id/comments` — List komentar
- `POST /api/posts/:id/comments` — Buat komentar/balasan
- `PUT /api/comments/:id/upvote` — Toggle upvote komentar

### Admin

- `GET /api/admin/dashboard` — Statistik
- `PUT /api/admin/users/:id/ban` — Ban user
- `DELETE /api/admin/posts/:id` — Hapus post
- `POST /api/admin/categories` — Tambah kategori

---

## Screenshots

### Forum Page

- Layout 2 kolom: feed + trending
- Filter kategori, status, search
- Card-based modern UI

### Admin Dashboard

- Statistik forum
- Manajemen user, post, komentar, kategori, tag

---
