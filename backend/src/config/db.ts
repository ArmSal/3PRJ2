import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support DATABASE_URL (Render.com) or individual DB_* vars
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'gaming_platform',
      port: parseInt(process.env.DB_PORT || '5432'),
    });

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed Query:', { text, duration, rows: res.rowCount });
  }
  
  return res;
};

export default pool;
