import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Tag from './models/Tag.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import Notification from './models/Notification.js';

dotenv.config();

// Helper function untuk memperpendek penulisan bcrypt.hash
const h = (pass) => bcrypt.hash(pass, 10);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Tag.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // Create users — setiap user di-hash passwordnya masing-masing
  const users = await User.create([
    { username: 'andi_r',  email: 'andi@mahasiswa.ac.id',  passwordHash: await h('password123') },
    { username: 'budi_s',  email: 'budi@mahasiswa.ac.id',  passwordHash: await h('password123') },
    { username: 'citra_w', email: 'citra@mahasiswa.ac.id', passwordHash: await h('password123') },
    { username: 'dina_p',  email: 'dina@mahasiswa.ac.id',  passwordHash: await h('password123') },
  ]);
  console.log(`Created ${users.length} users`);

  // Create categories
  const categories = await Category.create([
    { name: 'Basis Data', slug: 'basis-data', description: 'Diskusi seputar mata kuliah basis data' },
    { name: 'Pemrograman Web', slug: 'pemrograman-web', description: 'Diskusi seputar pemrograman web' },
    { name: 'Algoritma & Struktur Data', slug: 'algoritma-struktur-data', description: 'Diskusi tentang algoritma dan struktur data' },
    { name: 'Jaringan Komputer', slug: 'jaringan-komputer', description: 'Diskusi tentang jaringan komputer' },
    { name: 'Sistem Operasi', slug: 'sistem-operasi', description: 'Diskusi tentang sistem operasi' },
  ]);
  console.log(`Created ${categories.length} categories`);

  // Create tags
  const tags = await Tag.create([
    { name: 'mongodb', postCount: 3 },
    { name: 'sql', postCount: 2 },
    { name: 'nosql', postCount: 2 },
    { name: 'javascript', postCount: 2 },
    { name: 'react', postCount: 1 },
    { name: 'express', postCount: 1 },
    { name: 'indexing', postCount: 1 },
    { name: 'normalisasi', postCount: 1 },
    { name: 'css', postCount: 1 },
    { name: 'api', postCount: 1 },
  ]);
  console.log(`Created ${tags.length} tags`);

  // Create posts
  const posts = await Post.create([
    {
      title: 'Kapan pakai embed vs reference di MongoDB?',
      body: 'Saya bingung menentukan kapan harus embed document dan kapan pakai reference (ObjectId) di MongoDB. Ada yang bisa jelaskan rule of thumb-nya? Misalnya untuk kasus forum seperti ini, apakah comments sebaiknya di-embed di dalam post atau jadi collection terpisah?',
      authorId: users[0]._id,
      categoryId: categories[0]._id,
      tags: [tags[0]._id, tags[2]._id],
      upvotes: [
        { userId: users[1]._id },
        { userId: users[2]._id },
        { userId: users[3]._id },
      ],
      viewers: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
      viewCount: 4,
      isSolved: true,
    },
    {
      title: 'Apa itu indexing di MongoDB dan kapan harus dipakai?',
      body: 'Saya baru belajar MongoDB dan sering dengar soal indexing. Apa sebenarnya index itu? Apakah semua field perlu di-index? Bagaimana dampaknya ke performa read dan write?',
      authorId: users[1]._id,
      categoryId: categories[0]._id,
      tags: [tags[0]._id, tags[6]._id],
      upvotes: [
        { userId: users[0]._id },
        { userId: users[2]._id },
      ],
      viewers: [users[0]._id, users[1]._id, users[2]._id],
      viewCount: 3,
      isSolved: false,
    },
    {
      title: 'Cara membuat REST API dengan Express.js?',
      body: 'Saya ingin membuat REST API untuk project tugas besar. Stack yang saya pakai adalah Node.js + Express. Bagaimana struktur folder dan best practice-nya? Apakah perlu pakai MVC pattern?',
      authorId: users[2]._id,
      categoryId: categories[1]._id,
      tags: [tags[3]._id, tags[5]._id, tags[9]._id],
      upvotes: [
        { userId: users[0]._id },
        { userId: users[1]._id },
        { userId: users[3]._id },
      ],
      viewers: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
      viewCount: 4,
      isSolved: true,
    },
    {
      title: 'Perbedaan Normalisasi 1NF, 2NF, dan 3NF?',
      body: 'Bisa tolong jelaskan perbedaan antara First Normal Form, Second Normal Form, dan Third Normal Form? Saya masih bingung kapan sebuah tabel dikatakan sudah memenuhi masing-masing level normalisasi.',
      authorId: users[3]._id,
      categoryId: categories[0]._id,
      tags: [tags[1]._id, tags[7]._id],
      upvotes: [
        { userId: users[0]._id },
      ],
      viewers: [users[0]._id, users[3]._id],
      viewCount: 2,
      isSolved: false,
    },
    {
      title: 'Bagaimana cara deploy React app ke production?',
      body: 'Project React saya sudah jadi di lokal. Bagaimana cara deploy ke server production? Apakah lebih baik pakai Vercel, Netlify, atau VPS sendiri? Apa yang perlu diperhatikan?',
      authorId: users[0]._id,
      categoryId: categories[1]._id,
      tags: [tags[3]._id, tags[4]._id],
      upvotes: [
        { userId: users[1]._id },
        { userId: users[2]._id },
      ],
      viewers: [users[0]._id, users[1]._id, users[2]._id],
      viewCount: 3,
      isSolved: false,
    },
    {
      title: 'Aggregation Pipeline MongoDB untuk pemula',
      body: 'Saya perlu menggunakan aggregation pipeline di MongoDB untuk project tugas besar. Bisakah jelaskan tahapan dasar seperti $match, $group, $lookup, dan $sort dengan contoh sederhana?',
      authorId: users[1]._id,
      categoryId: categories[0]._id,
      tags: [tags[0]._id, tags[2]._id],
      upvotes: [
        { userId: users[0]._id },
        { userId: users[2]._id },
        { userId: users[3]._id },
      ],
      viewers: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
      viewCount: 4,
      isSolved: true,
    },
  ]);
  console.log(`Created ${posts.length} posts`);

  // Create comments
  const comment1 = await Comment.create({
    postId: posts[0]._id,
    authorId: users[1]._id,
    body: 'Gunakan embed jika data selalu dibaca bersama dan jumlahnya terbatas (misal upvotes). Gunakan reference jika data bersifat independen, bisa berubah, atau jumlahnya tidak terbatas (misal comments). Rule of thumb: "data yang together stays together".',
    parentId: null,
    upvotes: [{ userId: users[0]._id }, { userId: users[2]._id }],
    isAccepted: true,
  });

  const comment2 = await Comment.create({
    postId: posts[0]._id,
    authorId: users[2]._id,
    body: 'Tambahan: perhatikan juga batasan 16MB per document di MongoDB. Jika embed bisa menyebabkan document membengkak, lebih baik pakai reference.',
    parentId: null,
    upvotes: [{ userId: users[0]._id }],
  });

  // Nested reply
  await Comment.create({
    postId: posts[0]._id,
    authorId: users[0]._id,
    body: 'Terima kasih! Jadi untuk kasus forum ini, comments lebih baik pakai reference ya karena jumlahnya bisa sangat banyak?',
    parentId: comment1._id,
    upvotes: [],
  });

  await Comment.create({
    postId: posts[0]._id,
    authorId: users[1]._id,
    body: 'Betul sekali! Comments sebagai collection terpisah dengan referensi postId adalah pendekatan yang tepat.',
    parentId: comment1._id,
    upvotes: [{ userId: users[0]._id }],
  });

  // Update post 0 with accepted comment
  await Post.findByIdAndUpdate(posts[0]._id, { acceptedCommentId: comment1._id });

  // Comments for post 2
  const comment3 = await Comment.create({
    postId: posts[2]._id,
    authorId: users[3]._id,
    body: 'Untuk struktur folder Express, saya rekomendasikan pattern ini:\n- routes/ untuk definisi endpoint\n- controllers/ untuk business logic\n- models/ untuk schema database\n- middleware/ untuk auth, validation, dll\n\nIni mengikuti separation of concerns.',
    parentId: null,
    upvotes: [{ userId: users[2]._id }, { userId: users[0]._id }],
    isAccepted: true,
  });

  await Post.findByIdAndUpdate(posts[2]._id, { acceptedCommentId: comment3._id });

  await Comment.create({
    postId: posts[2]._id,
    authorId: users[0]._id,
    body: 'Jangan lupa pakai middleware untuk error handling global. Buat satu file errorHandler.js di middleware dan pasang di app.use() paling bawah.',
    parentId: null,
    upvotes: [{ userId: users[2]._id }],
  });

  // Comments for post 5
  const comment5 = await Comment.create({
    postId: posts[5]._id,
    authorId: users[2]._id,
    body: 'Aggregation pipeline itu seperti assembly line di pabrik. Data masuk dari satu stage ke stage berikutnya:\n\n1. $match — filter dokumen (seperti WHERE di SQL)\n2. $group — kelompokkan data (seperti GROUP BY)\n3. $lookup — join dengan collection lain (seperti JOIN)\n4. $sort — urutkan hasil\n5. $project — pilih field yang mau ditampilkan\n\nContoh: cari total post per kategori yang belum dihapus.',
    parentId: null,
    upvotes: [{ userId: users[0]._id }, { userId: users[1]._id }, { userId: users[3]._id }],
    isAccepted: true,
  });

  await Post.findByIdAndUpdate(posts[5]._id, { acceptedCommentId: comment5._id });

  // Comment for post 1
  await Comment.create({
    postId: posts[1]._id,
    authorId: users[2]._id,
    body: 'Index di MongoDB itu seperti daftar isi di buku. Tanpa index, MongoDB harus scan semua dokumen (collection scan). Dengan index, query langsung ke dokumen yang tepat. Tapi jangan index semua field — tiap index memakan storage dan memperlambat write.',
    parentId: null,
    upvotes: [{ userId: users[1]._id }],
  });

  console.log('Created comments with nested replies');

  // Create sample notifications — semua user punya notifikasi
  await Notification.create([
    // === ANDI (users[0]) — 3 notifikasi ===
    {
      userId: users[0]._id,
      type: 'new_answer',
      postId: posts[0]._id,
      message: 'budi_s menjawab pertanyaan "Kapan pakai embed vs reference di MongoDB?"',
      isRead: false,
    },
    {
      userId: users[0]._id,
      type: 'new_reply',
      postId: posts[0]._id,
      message: 'citra_w membalas komentar Anda di "Kapan pakai embed vs reference?"',
      isRead: false,
    },
    {
      userId: users[0]._id,
      type: 'new_answer',
      postId: posts[2]._id,
      message: 'citra_w menjawab pertanyaan "Aggregation Pipeline MongoDB untuk pemula"',
      isRead: true,
    },

    // === BUDI (users[1]) — 3 notifikasi ===
    {
      userId: users[1]._id,
      type: 'answer_accepted',
      postId: posts[0]._id,
      message: 'Jawaban Anda di "Kapan pakai embed vs reference?" dipilih sebagai jawaban terbaik!',
      isRead: false,
    },
    {
      userId: users[1]._id,
      type: 'new_reply',
      postId: posts[0]._id,
      message: 'andi_r membalas jawaban Anda di "Kapan pakai embed vs reference?"',
      isRead: false,
    },
    {
      userId: users[1]._id,
      type: 'new_answer',
      postId: posts[3]._id,
      message: 'dina_p menjawab pertanyaan "Perbedaan Normalisasi 1NF, 2NF, dan 3NF?"',
      isRead: true,
    },

    // === CITRA (users[2]) — 3 notifikasi ===
    {
      userId: users[2]._id,
      type: 'answer_accepted',
      postId: posts[3]._id,
      message: 'Jawaban Anda di "Cara membuat REST API?" dipilih sebagai jawaban terbaik!',
      isRead: false,
    },
    {
      userId: users[2]._id,
      type: 'new_reply',
      postId: posts[2]._id,
      message: 'budi_s membalas komentar Anda di "Aggregation Pipeline MongoDB"',
      isRead: false,
    },
    {
      userId: users[2]._id,
      type: 'answer_accepted',
      postId: posts[2]._id,
      message: 'Jawaban Anda di "Aggregation Pipeline MongoDB" dipilih sebagai jawaban terbaik!',
      isRead: true,
    },

    // === DINA (users[3]) — 3 notifikasi ===
    {
      userId: users[3]._id,
      type: 'answer_accepted',
      postId: posts[3]._id,
      message: 'Jawaban Anda di "REST API Express.js" dipilih sebagai jawaban terbaik!',
      isRead: false,
    },
    {
      userId: users[3]._id,
      type: 'new_answer',
      postId: posts[0]._id,
      message: 'budi_s menjawab pertanyaan "Kapan pakai embed vs reference di MongoDB?"',
      isRead: false,
    },
    {
      userId: users[3]._id,
      type: 'new_reply',
      postId: posts[1]._id,
      message: 'citra_w membalas komentar Anda di "Apa itu indexing di MongoDB?"',
      isRead: true,
    },
  ]);
  console.log('Created notifications');

  console.log('\n✅ Seed completed!');
  console.log('\nAkun demo:');
  console.log('  andi@mahasiswa.ac.id / password123');
  console.log('  budi@mahasiswa.ac.id / password123');
  console.log('  citra@mahasiswa.ac.id / password123');
  console.log('  dina@mahasiswa.ac.id / password123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
