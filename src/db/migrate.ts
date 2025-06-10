import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';

// This script is used to run the migrations
async function main() {
  console.log('Starting database migrations...');
  
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();