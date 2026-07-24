import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

dotenv.config();

async function createAdmin() {
  try {
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
      console.log('Usage: npm run create-admin <username> <password>');
      process.exit(1);
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [username, hashedPwd]
    );

    console.log(`✅ Admin created: ${username}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

createAdmin();
