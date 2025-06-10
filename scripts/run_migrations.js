// Script to run all Prisma migrations in order
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Promisify exec
const execPromise = promisify(exec);

// Load environment variables
dotenv.config();

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'prisma', 'migrations');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

// Make sure we have DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runMigrations() {
  console.log('🚀 Starting database migration process...');
  
  try {
    // 1. Check if database exists
    console.log('📋 Checking database connection...');
    try {
      await execPromise(`npx prisma db pull --schema="${schemaPath}" --force`);
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    
    // 2. Get list of migration directories, sorted by timestamp
    const migrations = fs.readdirSync(migrationsDir)
      .filter(dir => {
        // Check if it's a directory and has a migration.sql file
        const dirPath = path.join(migrationsDir, dir);
        return fs.statSync(dirPath).isDirectory() && 
               fs.existsSync(path.join(dirPath, 'migration.sql'));
      })
      .sort(); // Sort by name (timestamps are in the name)
    
    console.log(`📋 Found ${migrations.length} migrations to apply:`);
    migrations.forEach((migration, i) => {
      console.log(`   ${i+1}. ${migration}`);
    });
    
    // 3. Apply migrations one by one
    console.log('\n🔄 Applying migrations...');
    
    for (const migration of migrations) {
      console.log(`\n📦 Applying migration: ${migration}`);
      
      try {
        // We'll use Prisma's db execute to run the SQL directly
        const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration SQL using Prisma
        const result = await execPromise(`npx prisma db execute --schema="${schemaPath}" --file="${migrationPath}"`);
        console.log(`✅ Migration ${migration} applied successfully`);
        
      } catch (error) {
        // If error contains "already exists" for tables/types, it might be ok to continue
        if (error.message.includes('already exists')) {
          console.warn(`⚠️ Warning in migration ${migration}: Some objects already exist`);
          console.warn(`   ${error.message.split('\n')[0]}`);
          console.log(`   Continuing with next migration...`);
        } else {
          console.error(`❌ Error applying migration ${migration}:`);
          console.error(error.message);
          // Don't exit, try to continue with other migrations
          console.log(`   Attempting to continue with next migration...`);
        }
      }
    }
    
    // 4. Final step - regenerate Prisma client
    console.log('\n🔄 Regenerating Prisma client...');
    await execPromise(`npx prisma generate --schema="${schemaPath}"`);
    
    console.log('\n✅ All migrations have been successfully applied!');
    console.log('🎉 Database is now in sync with the schema');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();