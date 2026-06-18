import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL client error (webhook_db):', err);
  process.exit(-1);
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  console.log('✅ PostgreSQL connected (webhook_db)');
  client.release();
}
