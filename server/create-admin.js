import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.argv[2] || 'admin@student.telkomuniversity.ac.id';
  const password = process.argv[3] || 'AdminPassword123!';
  const username = process.argv[4] || 'admin';

  // Cek jika admin sudah ada
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log('Updated to admin role');
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    username,
    email,
    password: passwordHash,
    role: 'admin'
  });

  console.log('✅ Admin created successfully!');
  console.log('Email:', admin.email);
  console.log('Username:', admin.username);
  console.log('Password: [use the one you provided]');

  await mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});