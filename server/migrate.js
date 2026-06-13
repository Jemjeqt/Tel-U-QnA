import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('🔄 Running migration for existing users...');

  // Tambahkan role dan isBanned ke semua user yang belum punya
  const result = await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'user', isBanned: false } }
  );

  console.log(`✅ Migrated ${result.modifiedCount} users`);
  console.log('All existing users now have:');
  console.log('  - role: "user"');
  console.log('  - isBanned: false');

  await mongoose.disconnect();
  console.log('✅ Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});