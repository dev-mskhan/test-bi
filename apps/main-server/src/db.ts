import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
  process.exit(-1);
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  console.log('✅ PostgreSQL connected (main_db)');
  client.release();
}