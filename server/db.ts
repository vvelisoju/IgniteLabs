import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { prisma } from './prisma';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Create a PostgreSQL connection pool (kept for backward compatibility)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export prisma client instead of drizzle
export const db = prisma;

// Function to test database connection
export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT NOW()`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}