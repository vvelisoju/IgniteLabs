import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle database instance with our schema
export const db = drizzle(pool, { schema });

// Export for use in migration scripts
export { pool };